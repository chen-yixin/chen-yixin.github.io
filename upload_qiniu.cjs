"use strict";

/**
 * @file 将 Hexo 构建产物增量同步到七牛云对象存储，并刷新变更文件的 CDN 缓存。
 *
 * 用法：
 *   node upload_qiniu.cjs <bucket> <accessKey> <secretKey> <domain>
 *
 * 参数缺省时会依次回退到 QINIU_BUCKET / QINIU_ACCESS_KEY / QINIU_SECRET_KEY /
 * QINIU_BUCKET_DOMAIN 环境变量。
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const glob = require("glob");
const qiniu = require("qiniu");

/** CI 下载的 Pages artifact 路径。 */
const TAR_PATH = "./download-artifact/github-pages/artifact.tar";
/** 构建产物解压目录。 */
const LOCAL_DIR = "./public";
/** 七牛 batch 接口单次最多支持的子操作数。 */
const BATCH_OPS_LIMIT = 1000;
/** 同时进行的上传数量，过高容易触发七牛限流。 */
const UPLOAD_CONCURRENCY = 8;
/** 单次 CDN 刷新请求包含的 URL 数（七牛单次上限为 100）。 */
const REFRESH_BATCH_SIZE = 30;
/** 单个请求的最大重试次数（不含首次）。 */
const MAX_RETRIES = 3;
/** 重试的初始等待时间，按指数退避增长。 */
const RETRY_BASE_DELAY_MS = 500;
/** 超过该大小的文件改用分片上传（七牛表单上传限制为 4MB）。 */
const RESUMABLE_THRESHOLD = 4 * 1024 * 1024;
/** 分片上传的分片大小，同时也是七牛 ETag 的分块大小。 */
const CHUNK_SIZE = 4 * 1024 * 1024;
/**
 * 这些资源改由 jsDelivr 提供（见主题配置 vendors.npm_cdn），站点页面不再引用本地副本。
 * 构建产物中即使存在也不上传，并清理对象存储中的历史遗留文件。
 */
const EXCLUDED_PREFIXES = [
  "js/",
  "css/",
  "vendors/",
  "extentions/waline.",
];

/**
 * 判断文件是否属于「不应存在于站点上的主题静态资源」。
 * @param {string} filePath 构建产物相对路径
 * @returns {boolean} 是否应忽略
 */
const isExcluded = (filePath) =>
  EXCLUDED_PREFIXES.some((prefix) => filePath.startsWith(prefix));

/** 兼容 glob v9+ 的 `globSync` 命名导出与旧版的 `glob.sync`。 */
const globSync = glob.globSync || glob.sync;

/**
 * 手动触发时强制刷新所有页面。
 * 用于「文件已上传、但 CDN 刷新因额度耗尽失败」后的补刷：
 * 此时重跑不会再产生变更文件，普通流程会跳过刷新。
 */
const FORCE_REFRESH = process.env.FORCE_REFRESH === "1";

/**
 * 读取命令行参数，缺省时回退到同名环境变量。
 * @param {number} index 参数在 process.argv 中的位置
 * @param {string} envName 环境变量名
 * @returns {string} 去除首尾空白后的参数值，缺省时为空字符串
 */
const readArg = (index, envName) =>
  (process.argv[index] || process.env[envName] || "").trim();

/**
 * 规范化 CDN 域名：去掉首尾空白与尾部斜杠，未写协议时补上 https://。
 * @param {string} domain 原始域名，如 `hoboro.top` 或 `https://hoboro.top/`
 * @returns {string} 可用于拼接 URL 的域名
 */
const normalizeDomain = (domain) => {
  const trimmed = domain.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * 读取并校验运行参数。
 * @returns {{bucket: string, accessKey: string, secretKey: string, domain: string}} 运行参数
 * @throws {Error} 缺少必需参数时抛出
 */
const loadOptions = () => {
  const options = {
    bucket: readArg(2, "QINIU_BUCKET"),
    accessKey: readArg(3, "QINIU_ACCESS_KEY"),
    secretKey: readArg(4, "QINIU_SECRET_KEY"),
    domain: readArg(5, "QINIU_BUCKET_DOMAIN"),
  };

  const missing = [
    ["bucket", options.bucket],
    ["accessKey", options.accessKey],
    ["secretKey", options.secretKey],
    ["domain", options.domain],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `缺少必要参数：${missing.join("、")}。用法：node upload_qiniu.cjs <bucket> <accessKey> <secretKey> <domain>`
    );
  }

  options.domain = normalizeDomain(options.domain);
  return options;
};

/**
 * 创建七牛 SDK 客户端。
 * @param {{accessKey: string, secretKey: string}} options 鉴权参数
 * @returns {{mac: object, config: object, bucketManager: object}} 可用于上传与管理的客户端上下文
 */
const createClient = ({ accessKey, secretKey }) => {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const config = new qiniu.conf.Config();
  // 强制使用 HTTPS，避免凭证与文件内容通过明文传输。
  config.useHttpsDomain = true;
  return {
    mac,
    config,
    bucketManager: new qiniu.rs.BucketManager(mac, config),
  };
};

/**
 * 等待指定时间。
 * @param {number} ms 毫秒数
 * @returns {Promise<void>} 等待完成的 Promise
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 从七牛 SDK 抛出的错误中提取 HTTP 状态码。
 * @param {any} error SDK 错误对象
 * @returns {number|undefined} 状态码，无法获取时为 undefined
 */
const getStatusCode = (error) =>
  (error && error.resp && error.resp.statusCode) ||
  (error && error.statusCode) ||
  undefined;

/**
 * 生成包含状态码的错误描述，便于在日志中定位失败原因。
 * @param {any} error SDK 错误对象
 * @returns {string} 错误描述
 */
const describeError = (error) => {
  if (!error) return "未知错误";
  const message = error.message || String(error);
  const statusCode = getStatusCode(error);
  return statusCode ? `${message}（status=${statusCode}）` : message;
};

/**
 * 判断错误是否值得重试：网络错误与 408/429/5xx 可重试，
 * 其余 4xx、业务错误和本地文件缺失直接失败。
 * @param {any} error SDK 错误对象
 * @returns {boolean} 是否可重试
 */
const isRetryable = (error) => {
  if (!error || error.retryable === false || error.code === "ENOENT") {
    return false;
  }
  const statusCode = getStatusCode(error);
  if (!statusCode) return true;
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
};

/**
 * 以指数退避重试执行异步任务。
 * @template T
 * @param {() => Promise<T>} task 任务工厂，每次重试都会重新调用
 * @param {string} label 日志中标识任务的名称
 * @param {number} [maxRetries=MAX_RETRIES] 最大重试次数（不含首次）
 * @returns {Promise<T>} 任务成功时的结果
 * @throws {any} 重试耗尽后抛出最后一次错误
 */
const withRetry = async (task, label, maxRetries = MAX_RETRIES) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryable(error)) break;

      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.warn(
        `[重试] ${label} 第 ${attempt + 1} 次失败：${describeError(
          error
        )}，${delay}ms 后重试`
      );
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * 以固定并发度处理数组中的每一项，结果顺序与输入一致。
 * @template T, R
 * @param {T[]} items 输入数组
 * @param {number} concurrency 并发上限
 * @param {(item: T, index: number) => Promise<R>} worker 处理函数
 * @returns {Promise<R[]>} 与输入顺序一致的处理结果
 */
const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  /**
   * 不断领取下一项，直到所有任务被分配完。
   * @returns {Promise<void>} 分配并处理完成的 Promise
   */
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  };

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    run
  );
  await Promise.all(runners);
  return results;
};

/**
 * 将 CI 下载的 Pages artifact 解压到构建目录。
 * 使用 execFileSync 直接调用 tar，避免 shell 解析路径中的空格或特殊字符。
 * @param {string} tarPath artifact tar 文件路径
 * @param {string} targetDir 解压目标目录
 * @returns {void}
 * @throws {Error} tar 文件不存在时抛出
 */
const extractArtifact = (tarPath, targetDir) => {
  if (!fs.existsSync(tarPath)) {
    throw new Error(`找不到构建产物：${tarPath}`);
  }
  fs.mkdirSync(targetDir, { recursive: true });
  execFileSync("tar", ["-xf", tarPath, "-C", targetDir], { stdio: "inherit" });
};

/**
 * 递归列出构建产物中的全部文件。
 * @param {string} dir 构建产物目录
 * @returns {string[]} 相对路径列表（统一使用 `/` 分隔，按字典序排序）
 */
const listFiles = (dir) =>
  globSync("**/*", { cwd: dir, nodir: true })
    // Windows 下 glob 可能返回反斜杠，七牛的 key 必须使用 `/`。
    .map((filePath) => filePath.replace(/\\/g, "/"))
    .sort();

/**
 * 计算一段数据的 SHA-1 摘要。
 * @param {Buffer} data 输入数据
 * @returns {Buffer} 20 字节摘要
 */
const sha1 = (data) => crypto.createHash("sha1").update(data).digest();

/**
 * 从指定位置读取固定长度的数据，并处理可能的短读。
 * @param {fs.promises.FileHandle} handle 文件句柄
 * @param {number} position 起始偏移
 * @param {number} length 期望读取的字节数
 * @returns {Promise<Buffer>} 实际读取到的数据
 */
const readExact = async (handle, position, length) => {
  const buffer = Buffer.allocUnsafe(length);
  let offset = 0;

  while (offset < length) {
    const { bytesRead } = await handle.read(
      buffer,
      offset,
      length - offset,
      position + offset
    );
    if (bytesRead === 0) break;
    offset += bytesRead;
  }

  return buffer.subarray(0, offset);
};

/**
 * 按七牛规范编码 ETag：前缀字节 + 摘要，转 URL-safe Base64 并去掉尾部填充。
 * @param {number} prefix 前缀字节（0x16 表示未分块，0x96 表示已分块）
 * @param {Buffer} digest SHA-1 摘要
 * @returns {string} URL-safe Base64 编码的 ETag
 */
const encodeEtag = (prefix, digest) =>
  Buffer.concat([Buffer.from([prefix]), digest])
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * 计算本地文件的七牛 ETag，用于与远端 stat 返回的 `hash` 精确比对。
 *
 * 规则：不超过 4MB 时为 `0x16 + sha1(内容)`；超过 4MB 时按 4MB 分块，
 * 对每块取 SHA-1 后拼接再取一次 SHA-1，前缀为 `0x96`。
 * @param {string} filePath 本地文件路径
 * @returns {Promise<string>} ETag
 */
const computeEtag = async (filePath) => {
  const { size } = await fs.promises.stat(filePath);
  const handle = await fs.promises.open(filePath, "r");

  try {
    if (size <= CHUNK_SIZE) {
      return encodeEtag(0x16, sha1(await handle.readFile()));
    }

    const blockDigests = [];
    for (let position = 0; position < size; position += CHUNK_SIZE) {
      const length = Math.min(CHUNK_SIZE, size - position);
      blockDigests.push(sha1(await readExact(handle, position, length)));
    }

    return encodeEtag(0x96, sha1(Buffer.concat(blockDigests)));
  } finally {
    await handle.close();
  }
};

/**
 * 执行一批 stat 操作。
 * @param {object} bucketManager 七牛 BucketManager
 * @param {string[]} operations stat 操作列表
 * @param {number} expected 期望返回的条目数
 * @returns {Promise<Array<{code: number, data?: {fsize: number, hash?: string}}>>} 操作结果
 * @throws {Error} 请求失败或返回格式异常时抛出
 */
const batchStat = async (bucketManager, operations, expected) => {
  const result = await bucketManager.batch(operations);
  const statusCode = result && result.resp && result.resp.statusCode;

  if (statusCode && (statusCode < 200 || statusCode >= 300)) {
    const error = new Error(`批量查询失败：status=${statusCode}`);
    error.statusCode = statusCode;
    throw error;
  }

  const items = result && result.data;
  if (!Array.isArray(items)) {
    throw new Error(`批量查询返回格式异常：${JSON.stringify(items)}`);
  }
  if (items.length !== expected) {
    throw new Error(
      `批量查询返回条目数不匹配：期望 ${expected}，实际 ${items.length}`
    );
  }

  return items;
};

/**
 * 批量查询远端文件信息，按七牛限制自动分批。
 * @param {object} bucketManager 七牛 BucketManager
 * @param {string} bucket 空间名称
 * @param {string[]} filePaths 待查询的文件 key
 * @returns {Promise<Record<string, {fsize: number, hash?: string}>>} key 到远端信息的映射
 */
const fetchRemoteInfo = async (bucketManager, bucket, filePaths) => {
  const remoteInfo = Object.create(null);

  for (let start = 0; start < filePaths.length; start += BATCH_OPS_LIMIT) {
    const batch = filePaths.slice(start, start + BATCH_OPS_LIMIT);
    const operations = batch.map((filePath) =>
      qiniu.rs.statOp(bucket, filePath)
    );

    const results = await withRetry(
      () => batchStat(bucketManager, operations, batch.length),
      `批量查询第 ${start / BATCH_OPS_LIMIT + 1} 批（${batch.length} 个文件）`
    );

    results.forEach((item, index) => {
      if (item && item.code === 200 && item.data) {
        remoteInfo[batch[index]] = item.data;
      }
    });
  }

  return remoteInfo;
};

/**
 * 分页列出指定前缀下的全部对象 key。
 * @param {object} bucketManager 七牛 BucketManager
 * @param {string} bucket 空间名称
 * @param {string} prefix 对象 key 前缀
 * @returns {Promise<string[]>} 对象 key 列表
 */
const listKeysByPrefix = async (bucketManager, bucket, prefix) => {
  const keys = [];
  let marker = "";

  for (;;) {
    const result = await withRetry(
      () =>
        new Promise((resolve, reject) => {
          bucketManager.listPrefix(
            bucket,
            { prefix, marker, limit: BATCH_OPS_LIMIT },
            (error, data, resp) => {
              if (error) {
                reject(error);
                return;
              }

              const statusCode = resp && resp.statusCode;
              if (statusCode && (statusCode < 200 || statusCode >= 300)) {
                const listError = new Error(`列举对象失败：status=${statusCode}`);
                listError.statusCode = statusCode;
                reject(listError);
                return;
              }

              resolve(data || {});
            }
          );
        }),
      `列举前缀 ${prefix}`
    );

    const items = Array.isArray(result.items) ? result.items : [];
    for (const item of items) {
      if (item && item.key) keys.push(item.key);
    }

    if (!result.marker || result.marker === marker || items.length === 0) break;
    marker = result.marker;
  }

  return keys;
};

/**
 * 批量删除对象，文件已不存在（612）视为成功。
 * @param {object} bucketManager 七牛 BucketManager
 * @param {string} bucket 空间名称
 * @param {string[]} keys 待删除的对象 key
 * @returns {Promise<number>} 删除（或已不存在）的对象数量
 */
const batchDelete = async (bucketManager, bucket, keys) => {
  let removed = 0;

  for (let start = 0; start < keys.length; start += BATCH_OPS_LIMIT) {
    const batch = keys.slice(start, start + BATCH_OPS_LIMIT);
    const operations = batch.map((key) => qiniu.rs.deleteOp(bucket, key));

    const result = await withRetry(
      () => bucketManager.batch(operations),
      `批量删除第 ${start / BATCH_OPS_LIMIT + 1} 批（${batch.length} 个文件）`
    );

    const items = Array.isArray(result && result.data) ? result.data : [];
    items.forEach((item, index) => {
      if (item && (item.code === 200 || item.code === 612)) {
        removed += 1;
      } else {
        console.warn(
          `删除失败 ${batch[index]}：code=${
            item && item.code
          } ${JSON.stringify(item && item.data)}`
        );
      }
    });
  }

  return removed;
};

/**
 * 清理对象存储中历史遗留的未使用主题资源。
 * 这些文件不再由构建产物提供，保留它们只会继续被扫描器命中、消耗 CDN 流量。
 * @param {object} bucketManager 七牛 BucketManager
 * @param {string} bucket 空间名称
 * @returns {Promise<number>} 清理的对象数量
 */
const pruneRemoteAssets = async (bucketManager, bucket) => {
  let removed = 0;

  for (const prefix of EXCLUDED_PREFIXES) {
    const keys = await listKeysByPrefix(bucketManager, bucket, prefix);
    if (keys.length === 0) continue;
    removed += await batchDelete(bucketManager, bucket, keys);
    console.log(`已清理 ${prefix} 下的 ${keys.length} 个遗留对象。`);
  }

  return removed;
};

/**
 * 比较本地与远端文件，找出需要上传的文件。
 * 先比较大小，大小一致时再比较 ETag，避免内容变化但大小不变的文件被漏传。
 * @param {string[]} filePaths 构建产物相对路径
 * @param {Record<string, {fsize: number, hash?: string}>} remoteInfo 远端文件信息
 * @param {string} localDir 本地构建目录
 * @returns {Promise<string[]>} 需要上传的文件
 */
const detectChanges = async (filePaths, remoteInfo, localDir) => {
  const changed = [];

  for (const filePath of filePaths) {
    const localPath = path.join(localDir, filePath);
    let localSize;

    try {
      ({ size: localSize } = await fs.promises.stat(localPath));
    } catch (error) {
      console.warn(`无法读取本地文件 ${filePath}：${error.message}，按变更处理`);
      changed.push(filePath);
      continue;
    }

    const remote = remoteInfo[filePath];
    if (!remote || remote.fsize !== localSize || !remote.hash) {
      changed.push(filePath);
      continue;
    }

    try {
      if ((await computeEtag(localPath)) !== remote.hash) {
        changed.push(filePath);
      }
    } catch (error) {
      console.warn(`计算 ETag 失败 ${filePath}：${error.message}，按变更处理`);
      changed.push(filePath);
    }
  }

  return changed;
};

/**
 * 校验上传结果，失败时抛出带状态码的错误。
 * @param {{data: any, resp: {statusCode: number}}} result SDK 返回结果
 * @param {string} key 目标 key
 * @returns {void}
 * @throws {Error} 状态码非 2xx 时抛出
 */
const assertUploadOk = (result, key) => {
  const statusCode = result && result.resp && result.resp.statusCode;

  if (statusCode && statusCode >= 200 && statusCode < 300) return;

  const error = new Error(
    `上传失败 key=${key} status=${statusCode} body=${JSON.stringify(
      result && result.data
    )}`
  );
  error.statusCode = statusCode;
  throw error;
};

/**
 * 通过表单方式上传小文件。
 * @param {object} config 七牛配置
 * @param {string} uploadToken 上传凭证
 * @param {string} key 目标 key
 * @param {string} filePath 本地文件路径
 * @returns {Promise<void>} 上传完成的 Promise
 */
const uploadForm = async (config, uploadToken, key, filePath) => {
  const uploader = new qiniu.form_up.FormUploader(config);
  const result = await uploader.putFile(uploadToken, key, filePath, null);
  assertUploadOk(result, key);
};

/**
 * 通过分片方式上传大文件（七牛表单上传限制为 4MB）。
 * @param {object} config 七牛配置
 * @param {string} uploadToken 上传凭证
 * @param {string} key 目标 key
 * @param {string} filePath 本地文件路径
 * @returns {Promise<void>} 上传完成的 Promise
 */
const uploadResumable = async (config, uploadToken, key, filePath) => {
  const uploader = new qiniu.resume_up.ResumeUploader(config);
  const putExtra = qiniu.resume_up.PutExtra.create();
  putExtra.version = "v2";
  putExtra.partSize = CHUNK_SIZE;

  const result = await uploader.putFileV2(
    uploadToken,
    key,
    filePath,
    putExtra
  );
  assertUploadOk(result, key);
};

/**
 * 上传单个文件到七牛，超过 4MB 时自动改用分片上传。
 * @param {{mac: object, config: object, bucket: string}} context 七牛客户端上下文
 * @param {string} key 对象存储中的 key
 * @param {string} filePath 本地文件路径
 * @returns {Promise<void>} 上传完成的 Promise
 */
const uploadFile = async (context, key, filePath) => {
  const { size } = await fs.promises.stat(filePath);
  const uploadToken = new qiniu.rs.PutPolicy({
    scope: `${context.bucket}:${key}`,
  }).uploadToken(context.mac);

  if (size > RESUMABLE_THRESHOLD) {
    await uploadResumable(context.config, uploadToken, key, filePath);
  } else {
    await uploadForm(context.config, uploadToken, key, filePath);
  }
};

/**
 * 根据变更文件生成需要刷新的 CDN URL。
 *
 * 每个页面只刷新一种形式：目录页刷新 `xxx/`，不再额外刷新 `xxx/index.html`。
 * 站点的 canonical、sitemap 与站内链接都使用目录形式，直接访问 `index.html`
 * 的流量很小；同时刷新两种形式会让七牛的 URL 刷新额度直接翻倍。
 * @param {string[]} changedFiles 已上传的文件（相对路径）
 * @param {string} domain 已规范化的域名
 * @returns {string[]} 去重后的 URL 列表
 */
const buildRefreshUrls = (changedFiles, domain) => {
  const urls = new Set();

  for (const filePath of changedFiles) {
    if (isExcluded(filePath)) continue;

    if (filePath === "index.html") {
      urls.add(`${domain}/`);
    } else if (filePath.endsWith("/index.html")) {
      urls.add(`${domain}/${filePath.slice(0, -"index.html".length)}`);
    } else {
      urls.add(`${domain}/${filePath}`);
    }
  }

  return [...urls];
};

/**
 * 调用七牛 CDN 刷新接口（SDK 仅提供回调形式，这里包装为 Promise）。
 * @param {object} mac 七牛鉴权对象
 * @param {string[]} urls 待刷新的 URL
 * @returns {Promise<void>} 刷新完成的 Promise
 * @throws {Error} HTTP 状态异常或业务 code 非 200 时抛出
 */
const refreshUrls = (mac, urls) =>
  new Promise((resolve, reject) => {
    const cdnManager = new qiniu.cdn.CdnManager(mac);

    cdnManager.refreshUrls(urls, (error, data, resp) => {
      if (error) {
        reject(error);
        return;
      }

      const statusCode = resp && resp.statusCode;
      if (statusCode && (statusCode < 200 || statusCode >= 300)) {
        const refreshError = new Error(
          `CDN 刷新失败：status=${statusCode} body=${JSON.stringify(data)}`
        );
        refreshError.statusCode = statusCode;
        reject(refreshError);
        return;
      }

      if (data && data.code && data.code !== 200) {
        const refreshError = new Error(
          `CDN 刷新失败：code=${data.code} error=${data.error || ""}`
        );
        // 七牛业务错误通常无法通过重试恢复，避免无意义的退避等待。
        refreshError.retryable = false;
        reject(refreshError);
        return;
      }

      resolve();
    });
  });

/**
 * 将毫秒数格式化为便于阅读的耗时。
 * @param {number} elapsedMs 毫秒数
 * @returns {string} 形如 `12.3s` 的耗时
 */
const formatDuration = (elapsedMs) => `${(elapsedMs / 1000).toFixed(1)}s`;

/**
 * 脚本入口：解压构建产物 → 增量检测 → 并发上传 → 刷新 CDN。
 * @returns {Promise<void>} 全部流程完成的 Promise
 */
const main = async () => {
  const startedAt = Date.now();
  const options = loadOptions();
  const client = createClient(options);

  extractArtifact(TAR_PATH, LOCAL_DIR);
  const allFiles = listFiles(LOCAL_DIR);
  const filePaths = allFiles.filter((filePath) => !isExcluded(filePath));
  console.log(
    `构建产物共 ${allFiles.length} 个文件，忽略 ${
      allFiles.length - filePaths.length
    } 个未使用的主题资源。`
  );

  if (filePaths.length === 0) {
    throw new Error(`构建产物为空：${TAR_PATH}`);
  }

  // 清理历史上传的 js/css/vendors 副本；失败不阻断部署，仅提示。
  try {
    const removed = await pruneRemoteAssets(
      client.bucketManager,
      options.bucket
    );
    if (removed > 0) {
      console.log(`已清理 ${removed} 个历史遗留的未使用资源。`);
    }
  } catch (error) {
    console.warn(
      `清理遗留资源失败（${describeError(error)}），继续执行后续步骤。`
    );
  }

  let changedFiles;
  try {
    const remoteInfo = await fetchRemoteInfo(
      client.bucketManager,
      options.bucket,
      filePaths
    );
    changedFiles = await detectChanges(filePaths, remoteInfo, LOCAL_DIR);
  } catch (error) {
    console.warn(`增量检测失败（${describeError(error)}），回退为全量上传。`);
    changedFiles = filePaths;
  }

  console.log(
    `需要上传 ${changedFiles.length} 个文件，跳过 ${
      filePaths.length - changedFiles.length
    } 个未变更文件。`
  );

  if (changedFiles.length === 0 && !FORCE_REFRESH) {
    console.log("没有需要上传的文件，跳过 CDN 刷新。");
    return;
  }

  if (changedFiles.length === 0) {
    console.log("没有需要上传的文件，按 FORCE_REFRESH 刷新全部页面。");
  }

  const uploadContext = {
    mac: client.mac,
    config: client.config,
    bucket: options.bucket,
  };
  const uploaded = [];
  const failed = [];

  await mapWithConcurrency(
    changedFiles,
    UPLOAD_CONCURRENCY,
    async (filePath) => {
      try {
        await withRetry(
          () =>
            uploadFile(
              uploadContext,
              filePath,
              path.join(LOCAL_DIR, filePath)
            ),
          `上传 ${filePath}`
        );
        uploaded.push(filePath);
      } catch (error) {
        failed.push({ filePath, error });
        console.error(`上传失败 ${filePath}：${describeError(error)}`);
      }
    }
  );

  console.log(
    `上传完成：成功 ${uploaded.length} 个，失败 ${failed.length} 个。`
  );

  // 正常情况下只刷新本次上传成功的文件；FORCE_REFRESH 时刷新全部页面，
  // 用于补刷「上传成功但刷新失败」的构建。
  const refreshSource = FORCE_REFRESH ? filePaths : uploaded;
  const urls = buildRefreshUrls(refreshSource, options.domain);
  let refreshFailed = false;

  for (let start = 0; start < urls.length; start += REFRESH_BATCH_SIZE) {
    const batch = urls.slice(start, start + REFRESH_BATCH_SIZE);
    try {
      // 七牛刷新接口没有幂等标识，超时重试会重复消耗刷新额度。
      // 因此最多重试 1 次，网络持续异常时宁可让流水线失败后人工处理。
      await withRetry(
        () => refreshUrls(client.mac, batch),
        `刷新 CDN（${batch.length} 个 URL）`,
        1
      );
    } catch (error) {
      // 文件已经上传成功，刷新失败只影响缓存新鲜度，不应让整个部署失败。
      refreshFailed = true;
      console.warn(
        `CDN 刷新失败（${describeError(error)}），跳过剩余 ${
          urls.length - start
        } 个 URL。`
      );
      break;
    }
  }

  if (refreshFailed) {
    console.log(
      "::warning::CDN 刷新未完成（通常是当日额度耗尽）。文件已上传；额度恢复后请手动运行 Build 并勾选 force_refresh 补刷。"
    );
  } else {
    console.log(`CDN 刷新完成：${urls.length} 个 URL。`);
  }

  if (failed.length > 0) {
    const preview = failed
      .slice(0, 10)
      .map(({ filePath }) => filePath)
      .join("、");
    throw new Error(
      `有 ${failed.length} 个文件上传失败：${preview}${
        failed.length > 10 ? " 等" : ""
      }`
    );
  }

  console.log(`全部完成，耗时 ${formatDuration(Date.now() - startedAt)}。`);
};

main().catch((error) => {
  console.error("同步失败：", error && (error.stack || error.message || error));
  process.exit(1);
});
