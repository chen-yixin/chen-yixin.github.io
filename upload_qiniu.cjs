const fs = require("fs");
const path = require("path");
const glob = require("glob");
const qiniu = require("qiniu");
const execSync = require("child_process").execSync;

const BATCH_SIZE = 20;
const BATCH_OPS_LIMIT = 1000;
const bucket = process.argv[2];
const accessKey = process.argv[3];
const secretKey = process.argv[4];
const domain = process.argv[5];
const domainClean = domain.replace(/\/+$/, "");
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const config = new qiniu.conf.Config();
const bucketManager = new qiniu.rs.BucketManager(mac, config);

const tarPath = "./download-artifact/github-pages/artifact.tar";
const localDir = "./public";
fs.mkdirSync(localDir, { recursive: true });
execSync(`tar -xvf ${tarPath} -C ${localDir}`);

const filePaths = glob.sync("**/*", { cwd: localDir, nodir: true });
console.log(`Found ${filePaths.length} files in build output.`);

const push = (key, filePath) => {
  return new Promise((resolve, reject) => {
    const options = { scope: `${bucket}:${key}` };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    formUploader.putFile(
      uploadToken,
      key,
      filePath,
      putExtra,
      (err, body, info) => {
        if (err) return reject(err);
        if (info && info.statusCode === 200) {
          console.log(`push Success key:${key}`);
          return resolve({ key, body, info });
        }
        reject(new Error(`push ${key} failed: ${info && info.statusCode}`));
      }
    );
  });
};

const refresh = (urls) => {
  console.log(`Refreshing CDN: ${urls.length} urls`);
  return new Promise((resolve, reject) => {
    const cdnManager = new qiniu.cdn.CdnManager(mac);
    cdnManager.refreshUrls(urls, (err, respBody, respInfo) => {
      if (err) return reject(err);
      console.log(
        `refresh Success status:${respInfo.statusCode} body:${JSON.stringify(
          respBody
        )}`
      );
      resolve({ respBody, respInfo });
    });
  });
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const batchStatRemote = async () => {
  const remoteInfo = {};

  for (let i = 0; i < filePaths.length; i += BATCH_OPS_LIMIT) {
    const batch = filePaths.slice(i, i + BATCH_OPS_LIMIT);
    const operations = batch.map((p) => qiniu.rs.statOp(bucket, p));

    const results = await new Promise((resolve, reject) => {
      bucketManager.batch(operations, (err, respBody, respInfo) => {
        if (err) return reject(err);
        if (respInfo.statusCode !== 200) {
          return reject(
            new Error(`batch stat failed: ${respInfo.statusCode}`)
          );
        }
        resolve(respBody);
      });
    });

    if (!Array.isArray(results)) {
      throw new Error(
        `Unexpected batch stat response: ${JSON.stringify(results)}`
      );
    }

    results.forEach((item, idx) => {
      if (item.code === 200) {
        remoteInfo[batch[idx]] = item.data;
      }
    });
  }

  return remoteInfo;
};

const detectChanges = (remoteInfo) => {
  const changed = [];
  for (const filePath of filePaths) {
    const localPath = path.join(localDir, filePath);
    let localSize;
    try {
      localSize = fs.statSync(localPath).size;
    } catch (e) {
      console.warn(`Cannot stat local file ${filePath}: ${e.message}`);
      changed.push(filePath);
      continue;
    }

    const remote = remoteInfo[filePath];
    if (!remote || remote.fsize !== localSize) {
      changed.push(filePath);
    }
  }
  return changed;
};

const buildRefreshUrls = (changedFiles) => {
  const urls = new Set();

  for (const f of changedFiles) {
    if (
      f.startsWith("js/") ||
      f.startsWith("css/") ||
      f.startsWith("vendors/")
    ) {
      continue;
    }
    urls.add(`${domainClean}/${f}`);

    if (f.endsWith("/index.html")) {
      urls.add(`${domainClean}/${f.replace(/index\.html$/, "")}`);
    }
  }

  if (changedFiles.includes("index.html")) {
    urls.add(domainClean);
  }

  return Array.from(urls);
};

const main = async () => {
  console.log(`Detecting file changes via batch stat...`);

  let changedFiles;
  try {
    const remoteInfo = await batchStatRemote();
    changedFiles = detectChanges(remoteInfo);
  } catch (e) {
    console.warn(
      `Change detection failed: ${e.message}. Falling back to upload all files.`
    );
    changedFiles = [...filePaths];
  }

  console.log(
    `Changed: ${changedFiles.length}, Unchanged: ${
      filePaths.length - changedFiles.length
    }`
  );

  if (changedFiles.length === 0) {
    console.log("No changes detected. Skipping upload and CDN refresh.");
    return;
  }

  console.log(`Uploading ${changedFiles.length} changed files...`);
  const uploadBatches = chunk(changedFiles, BATCH_SIZE);
  for (const batch of uploadBatches) {
    await Promise.all(batch.map((p) => push(p, path.join(localDir, p))));
  }
  console.log("All uploads complete.");

  const refreshUrls = buildRefreshUrls(changedFiles);
  if (refreshUrls.length > 0) {
    console.log(`Refreshing ${refreshUrls.length} CDN URLs...`);
    const refreshBatches = chunk(refreshUrls, 30);
    for (const batch of refreshBatches) {
      await refresh(batch);
    }
    console.log("CDN refresh complete.");
  } else {
    console.log("No CDN URLs to refresh.");
  }
};

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
