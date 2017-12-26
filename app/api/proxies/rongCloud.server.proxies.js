
const rongcloudSDK = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongcloudSDK.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);


var errorHandle = (err) => {
    console.log('---[IM REQUEST ERROR]---', err);
    return err.text;
}

// User
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

// IM
exports.sendContactNotification = async (currentUserID, contactID, message, operation, callback) => {
    try {
        let timestamp = Date.now();
        await sendContactNotification(currentUserID.toString(), contactID, operation, message, timestamp);
        callback(null, 200)
    } catch (err) {
        callback(err, 400)
    }
}

var sendContactNotification = (userID, contactID, operation, message, timestamp) => {
    let content = {
        operation: operation,
        sourceUserId: userID,
        targetUserId: contactID,
        message: message,
        extra: {
            sourceUserNickname: "System Notification",
            version: timestamp
        }
    };
    return new Promise((resolve, reject) => {
        return rongcloudSDK.message.system.publish(userID, [contactID], 'RC:ContactNtf', JSON.stringify(content), (err, resultText) => {
            if (err) {
                console.log('---[SYSTEM PUBLISH ERROR]---', err.response.body.errorMessage);
                reject(err.response.body.errorMessage);
            } else {
                resolve(resultText)
            }
        });
    })
};