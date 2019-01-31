let path = require('path')
let qiniu = require("qiniu");
// const QiniuConfig = require(path.resolve('./configs/config')).QiniuConfig
const QiniuConfig = require('../../../configs/config').QiniuConfig;
const Promise = require("bluebird");

qiniu.conf.ACCESS_KEY = QiniuConfig.AccessKey;
qiniu.conf.SECRET_KEY = QiniuConfig.SecretKey;


let config = new qiniu.conf.Config();
let formUploader = new qiniu.form_up.FormUploader(config);

let upToken = (bucket, key) => {
    let options = {
        scope: bucket + ":" + key    // 覆盖上传凭证
    }
    var putPolicy = new qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken();
}

let uploadAvatar = (upToken, key, localFile) => {
    return new Promise((resolve, reject) => {
        let extra = new qiniu.form_up.PutExtra();
        formUploader.putFile(upToken, key, localFile, extra, function (err, ret) {
            if (!err) {
                console.log('---[UPLOAD AVATAR SUCCESS]---', ret)
                // console.log(ret.hash, ret.key, ret.persistentId);
                resolve(ret)
            } else {
                console.log('---[UPLOAD AVATAR FAIL]---', err)
                reject(err.message)
            }
        });
    })
}

exports.uploadAvatar = async (fileName, localFile) => {
    try {
        const token = upToken(QiniuConfig.Bucket, fileName);
        return await uploadAvatar(token, fileName, localFile);
    } catch (err) {
        console.log(err)
        return err;
    }
}
