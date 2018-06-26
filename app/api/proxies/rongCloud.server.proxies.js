
const _ = require('lodash');
const rongCloud = require('rongcloud-sdk');
const RongCloudConfig = require('../../../configs/config').RongCloudConfig;

rongCloud.init(RongCloudConfig.appKey, RongCloudConfig.appSecret);


var errorHandle = (err) => {
    console.log('---[IM REQUEST ERROR]---', err);
    return err.text;
}

// User
exports.createUser = (userID, nickname, avatar, callback) => {
    rongCloud.user.getToken(_.toString(userID), nickname, avatar, (err, _result) => {
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

/**
 * IM - send concact notification
 * 
 * @param {*} currentUser 
 * @param {*} contactID 
 * @param {*} message 
 * @param {*} operation 
 * @param {*} userProfile 
 * @param {*} callback 
 */
exports.sendContactNotification = async (currentUser, contactID, message, operation, userProfile, callback) => {
    try {
        await sendContactNotification(currentUser, contactID, operation, message, userProfile);
        callback(null, 200)
    } catch (err) {
        callback(err, 400)
    }
}

// IM - send group notification
exports.sendGroupNotification = async (currentUserID, operation, userProfile, group, members, memberID) => {
    const groupId = _.toString(group.groupID);
    const groupNotificationMessage = {
        operatorUserId: _.toString(currentUserID),
        operation: operation,
        data: userProfile,
        message: '',
        extra: {
            groupID: groupId,
            version: Date.now(),
            group: group || null,
            members: members || null,
            memberID: memberID || null
        },
    };
    console.log('Sending GroupNotificationMessage: ', JSON.stringify(groupNotificationMessage));
    return new Promise((resolve, reject) => {
        return rongCloud.message.group.publish(currentUserID, groupId, 'RC:GrpNtf', JSON.stringify(groupNotificationMessage), (err, resultText) => {
            if (err) return reject(`Error: send group notification failed: ${err}`);

            console.log('Sending group notification Success: ', resultText);
            resolve(resultText);
        });
    });
};

// Group
exports.createGroup = (groupId, name, members) => {
    return new Promise((resolve, reject) => {
        rongCloud.group.create(members, groupId, name, (err, resultText) => {
            if (err) return reject(`Error: create group failed on IM server, error: ${err}`);

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
            if (err) return reject(`Error: join group failed on IM server, error: ${err}`);

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
};

exports.quitGroup = (groupId, targetUserID) => {
    return new Promise((resolve, reject) => {
        return rongCloud.group.quit(targetUserID, groupId, (err, resultText) => {
            if (err) return reject(`Error: quit group failed on IM server, error: ${err}`);

            let result = JSON.parse(resultText);
            if (result.code === 200) {
                console.log("Success: quit group success");
                resolve();
            } else {
                console.log('Error: quit group failed on IM server, error', result);
                reject(`Error: quit group failed on IM server, code: ${result.code}`);
            }
        })
    })
}

exports.dismissGroup = (currentUserID, groupId) => {
    return new Promise((resolve, reject) => {
        return rongCloud.group.dismiss(currentUserID, groupId, (err, resultText) => {
            if (err) return reject(`Error: quit group failed on IM server, error: ${err}`);

            let result = JSON.parse(resultText);
            if (result.code === 200) {
                console.log("Success: dismiss group success");
                resolve();
            } else {
                console.log('Error: dismiss group failed on IM server, error', result);
                reject(`Error: dismiss group failed on IM server, code: ${result.code}`);
            }
        })
    })
}

exports.renameGroup = (groupId, name) => {
    return new Promise((resolve, reject) => {
        rongCloud.group.refresh(groupId, name, (err, resultText) => {
            if (err) return reject(`Error: refresh group info failed on IM server, error: ${err}`);

            let result = JSON.parse(resultText);
            if (result.code === 200) {
                console.log("Success: refresh group name success");
                resolve();
            } else {
                console.log('Error: refresh group info failed on IM server, error', result);
                return reject(`Error: refresh group info failed on IM server, code: ${result.code}`);
            }
        })
    })
}

var sendContactNotification = (currentUser, contactID, operation, message, userProfile) => {
    let userID = _.toString(currentUser.userID);
    let content = {
        operation: operation,
        sourceUserId: userID,
        targetUserId: contactID,
        message: message,
        extra: {
            sourceUserNickname: "System Notification",
            version: Date.now(),
            userProfile: userProfile
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