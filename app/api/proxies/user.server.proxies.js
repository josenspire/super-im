const rongcloudSDK = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongcloudSDK.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);

var errorHandle = (err) => {
    console.log('---[IM REQUEST ERROR]---', err);
    return err.text;
}

exports.createUser = (userID, nickname, avatar, callback) => {
    rongcloudSDK.user.getToken(userID.toString(), nickname, avatar, (err, _result) => {
        if (err) {
            callback({ error: errorHandle(err) });
        } else {
            let result = JSON.parse(_result);
            if (result.code === 200) {
                callback({ data: result.token });
            } else {
                callback({ error: result });
            }
        }
    });
}
