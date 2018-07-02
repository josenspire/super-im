
const _ = require('lodash');
const { appKey, appSecret } = require('../../../configs/config').RongCloudConfig;

const rongCloud = require('rongcloud-sdk')({
    appkey: appKey,
    secret: appSecret,
});

let User = rongCloud.User;
let Group = rongCloud.Group;
let Message = rongCloud.Message;
let Private = Message.Private;
let GroupMessage = Message.Group;

var errorHandle = (err) => {
    console.log('---[IM REQUEST ERROR]---', err);
    return err.text;
}

// User
exports.createUser = (userID, nickname, avatar, callback) => {
    const user = { id: _.toString(userID), name: nickname, portrait: avatar || 'https://dn-qiniu-avatar.qbox.me/avatar/f9f953f958ef1505a241a3270dfa408d?qiniu-avatar' };
    User.register(user).then(result => {
        callback({ data: result.token });
    }, error => {
        console.log(error);
        callback({ error });
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
exports.sendContactNotification = async (currentUser = '', contactID = '', message = '', operation = '', userProfile = {}, callback) => {
    const userID = _.toString(currentUser.userID);
    const notificationMessage = {
        senderId: userID,
        targetId: contactID,
        objectName: 'RC:ContactNtf',
        content: {
            operation: operation,
            message: message,
            extra: {
                sourceUserNickname: "System Notification",
                version: Date.now(),
                userProfile: userProfile
            }
        },
    };
    const result = await Private.send(notificationMessage).catch(err => {
        console.log(`Error: send group notification failed: ${err}`);
        callback(err, 400)
    });
    console.log('Sending private notification Success: ', result);
    callback(null, 200)
}

// IM - send group notification
exports.sendGroupNotification = async ({ currentUserID = '', operation = '', group = {}, memberID = null, membersID = [], member = {}, bulletin = null }) => {
    const groupId = _.toString(group.groupID);
    let groupNotificationMessage = {
        senderId: currentUserID,
        targetId: groupId,
        objectName: 'RC:GrpNtf',
        content: {
            operation: operation,
            extra: {
                operatorUserID: currentUserID,
                group: group,
                memberID: memberID,
                membersID: membersID || [],
                member: member,
                bulletin: bulletin,
            },
        },
        isIncludeSender: 1,
    };
    console.log('Sending GroupNotificationMessage: ', JSON.stringify(groupNotificationMessage));

    const result = await GroupMessage.send(groupNotificationMessage).catch(err => {
        console.log(`Error: send group notification failed: ${err}`);
    });

    console.log('Sending group notification Success: ', result);
    return result.code;
};

// Group
exports.createGroup = async (groupId, name, members) => {
    const group = {
        id: _.toString(groupId),
        name: name,
        members: members,
    };
    const result = await Group.create(group).catch(err => {
        throw new Error(`Error: create group failed on IM server, error: ${err}`);
    });
    if (result.code === 200) {
        console.log("Success: create group success");
        return 'SUCCESS';
    } else {
        console.log(`Error: create group failed on IM server, error`, result);
        throw new Error(`Error: create group failed on IM server, code: ${result.code} `);
    }
};

exports.joinGroup = async (groupId, member) => {
    const group = {
        id: _.toString(groupId),
        member: member,
    };
    const result = await Group.join(group).catch(err => {
        throw new Error(`Error: join group failed on IM server, error: ${err} `);
    });
    if (result.code === 200) {
        console.log("Success: join group success");
        return result.code;
    } else {
        console.log(`Error: join group failed on IM server, error`, result);
        throw new Error(`Error: join group failed on IM server, code: ${result.code} `);
    }
};

exports.quitGroup = async (groupId, member) => {
    const group = {
        id: _.toString(groupId),
        member: member,
    };
    const result = await Group.quit(group).catch(err => {
        throw new Error(`Error: quit group failed on IM server, error: ${err} `);
    });
    if (result.code === 200) {
        console.log("Success: quit group success");
        return result.code;
    } else {
        console.log('Error: quit group failed on IM server, error', result);
        throw new Error(`Error: quit group failed on IM server, code: ${result.code} `);
    }
}

/**
 * 
 * @param {string} groupId  // group id
 * @param {object} member // 群主或群管理
 */
exports.dismissGroup = (groupId, member) => {
    const group = {
        id: groupId,
        member: member,
    };
    const result = Group.dismiss(group).catch(err => {
        throw new Error(`Error: dismiss group failed on IM server, error: ${err} `);
    });
    if (result.code === 200) {
        console.log("Success: dismiss group success");
        return result.code;
    } else {
        console.log('Error: dismiss group failed on IM server, error', result);
        throw new Error(`Error: dismiss group failed on IM server, code: ${result.code} `);
    }
}

exports.renameGroup = (groupId, name) => {
    const group = {
        id: groupId,
        name: name,
    };
    Group.update(group).catch(err => {
        throw new Error(`Error: refresh group info failed on IM server, error: ${err} `);
    });
    if (result.code === 200) {
        console.log("Success: update group success");
        return result.code;
    } else {
        console.log('Error: update group failed on IM server, error', result);
        throw new Error(`Error: update group failed on IM server, code: ${result.code} `);
    }
}
