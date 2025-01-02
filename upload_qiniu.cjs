const fs = require('fs');
const path = require('path');
const glob = require('glob');
const qiniu = require('qiniu');
const execSync = require('child_process').execSync;

const groupSize = 20;
const bucket = process.argv[2];
const accessKey = process.argv[3];
const secretKey = process.argv[4];
const domain = process.argv[5]
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

const tarPath = './download-artifact/github-pages/artifact.tar';
const localDir = './public';
fs.mkdirSync(localDir);
execSync(`tar -xvf ${tarPath} -C ${localDir}`);

const filePaths = glob.sync('**/*', { cwd: localDir, nodir: true });


const push = (key, filePath) => {
  return new Promise((resolve, reject) => {
    const options = { scope: `${bucket}:${key}` };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    formUploader.putFile(uploadToken, key, filePath, putExtra, (err, body, info) => {
      if (err) {
        reject(err);
      }
      if (info && info.statusCode == 200) {
        console.log(`push Success key:${key}`);
        resolve(info);
      } else {
        console.warn(`push Warning key:${key} info:${info}`);
        reject(info);
      }
    });
  });
};

const refresh = (urls) => {
  console.log(`Refreshing the urls. ${urls}`)
  return new Promise((resolve, reject) => {
    const cdnManager = new qiniu.cdn.CdnManager(mac);
    cdnManager.refreshUrls(urls, (err, respBody, respInfo) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      console.log(`refresh Success status:${respInfo.statusCode} body:${JSON.stringify(respBody)}`);
      resolve(respInfo);
    });
  });
};

const main = async () => {
  const groups = [];
  while (filePaths.length !== 0) {
    groups.push(filePaths.splice(0, groupSize));
  }

  groups.forEach(async(group) => {
    const urls = [];
    for (let filePath of group) {
      if (
        !filePath.startsWith('js/') &&
        !filePath.startsWith('css/') &&
        !filePath.startsWith('vendors/')
      ) {
        urls.push(`${domain}/${filePath}`);
      }
      await push(filePath, path.join(localDir, filePath));
    }

    await refresh(urls);
  });
};

main();
