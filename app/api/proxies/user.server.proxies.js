const rongcloudSDK = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongcloudSDK.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);

exports.createUser = (userID, nickName, avatar, callback) => {
    rongcloudSDK.user.getToken(userID, nickName, avatar || 'http://files.domain.com/avatar.jpg', (err, _result) => {
        if (err) {
            // Handle the error
            return callback(err);
            console.log('---[GET TOKEN ERROR]---', err);
        } else {
            let result = JSON.parse(_result);
            if (result.code === 200) {
                //Handle the result.token
                return callback(result.token);
            }
            return callback(result);
        }
    });
}

