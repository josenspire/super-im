
const rongCloud = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongCloud.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);


var errorHandle = (err) => {
    console.log('---[IM REQUEST ERROR]---', err);
    return err.text;
}

// User
exports.createUser = (userID, nickname, avatar, callback) => {
    rongCloud.user.getToken(userID.toString(), nickname, avatar, (err, _result) => {
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

// IM - send concact notification
exports.sendContactNotification = async (currentUserID, contactID, message, operation, remark, callback) => {
    try {
        await sendContactNotification(currentUserID.toString(), contactID, operation, message, remark);
        callback(null, 200)
    } catch (err) {
        callback(err, 400)
    }
}

// IM - send group notification
exports.sendGroupNotification = async (currentUserID, groupId, operation, remark, callback) => {
    try {
        await sendGroupNotification(currentUserID.toString(), groupId, operation, remark);
        callback(null, 200)
    } catch (err) {
        callback(err, 400)
    }
};

// Group
exports.createGroup = (groupId, name, members) => {
    return new Promise((resolve, reject) => {
        rongCloud.group.create(members, groupId, name, (err, resultText) => {
            if (err) {
                reject(`Error: create group failed on IM server, error: ${err}`);
            }
            let result = JSON.parse(resultText);
            if (result.code === 200) {
                console.log("Success: create group success");
                resolve();
            } else {
                console.log(`Error: create group failed on IM server, error`, result);
                reject(`Error: create group failed on IM server, code: ${result.code}`);
            }
        })
    })
};

exports.joinGroup = (groupId, name, members) => {
    return new Promise((resolve, reject) => {
        rongCloud.group.join(members, groupId, name, (err, resultText) => {
            if (err) {
                reject(`Error: join group failed on IM server, error: ${err}`);
            }
            let result = JSON.parse(resultText);
            if (result.code === 200) {
                console.log("Success: join group success");
                resolve();
            } else {
                console.log(`Error: join group failed on IM server, error`, result);
                reject(`Error: join group failed on IM server, code: ${result.code}`);
            }
        })
    })
}


var sendContactNotification = (userID, contactID, operation, message, remark) => {
    let content = {
        operation: operation,
        sourceUserId: userID,
        targetUserId: contactID,
        message: message,
        extra: {
            sourceUserNickname: "System Notification",
            version: Date.now(),
            nickname: remark ? remark.nickname : "",
            avatar: remark ? remark.avatar : ""
        }
    };
    return new Promise((resolve, reject) => {
        return rongCloud.message.system.publish(userID, [contactID], 'RC:ContactNtf', JSON.stringify(content), (err, resultText) => {
            if (err) {
                console.log('---[SYSTEM PUBLISH ERROR]---', err.response.body.errorMessage);
                reject(err.response.body.errorMessage);
            } else {
                resolve(resultText)
            }
        });
    })
};

var sendGroupNotification = (currentUserID, groupId, operation, remark) => {
    let groupNotificationMessage = {
        operatorUserId: currentUserID,
        operation: operation,
        data: remark,
        message: ''
    };
    console.log('Sending GroupNotificationMessage: ', JSON.stringify(groupNotificationMessage));
    return new Promise((resolve, reject) => {
        return rongCloud.message.group.publish(currentUserID, groupId, 'RC:GrpNtf', JSON.stringify(groupNotificationMessage), (err, resultText) => {
            if (err) {
                console.log('Error: send group notification failed: %s', err);
                reject(err);
            } else {
                console.log('Sending group notification Success: ', resultText);
                resolve(resultText);
            };
        });
    });
};