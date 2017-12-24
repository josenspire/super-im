
const rongcloudSDK = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongcloudSDK.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);

const CONTACT_OPERATION_REQUEST = 'op1'

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
exports.sendContactNotification = async (currentUserID, friendID, message, callback) => {
    try {
        let timestamp = Date.now();
        await sendContactNotification(currentUserID.toString(), friendID, CONTACT_OPERATION_REQUEST, message, timestamp);
        callback({ status: 200 })
    } catch (err) {
        callback({ status: 400, error: err })
    }
}

var sendContactNotification = (userID, friendID, operation, message, timestamp) => {
    let content = {
        operation: operation,
        sourceUserId: userID,
        targetUserId: friendID,
        message: message,
        extra: {
            sourceUserNickname: "系统消息",
            version: timestamp
        }
    };
    return new Promise((resolve, reject) => {
        return rongcloudSDK.message.system.publish(userID, [friendID], 'RC:ContactNtf', JSON.stringify(content), (err, resultText) => {
            if (err) {
                console.log('---[SYSTEM PUBLISH ERROR]---', err.response.body.errorMessage);
                reject(err.response.body.errorMessage);
            } else {
                resolve(resultText)
            }
        });
    })
};