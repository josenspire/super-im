const UserDao = require('../dao/user.server.dao')
const SMSService = require('./sms.server.service')
const CodeConstants = require('../utils/CodeConstants')

let IMProxie = require('../api/proxies/rongCloud.server.proxies')
let QiniuProxie = require('../api/proxies/qiniu.server.proxies')

const uuidv4 = require('uuid/v4');
const fs = require('fs')

const mongoose = require('mongoose')

// create user
exports.createUser = (user, cb) => {
    let userID = mongoose.Types.ObjectId();
    IMProxie.createUser(userID, user.nickname, null, response => {
        if (!response.error) {
            user._id = userID;
            UserDao.createUser(user, response.data, createCallback => {
                cb(createCallback)
            })
        } else {
            console.log('---[IM CRETEUSER FAIL]---', response.error)
            cb({
                status: CodeConstants.FAIL,
                data: {},
                message: response.error
            })
        }
    })

}

// user login
exports.queryUserByTelephoneAndPassword = (telephone, password, deviceID, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, _user => {
        if (_user.status === CodeConstants.SUCCESS) {
            if (_user.data.user.deviceID != deviceID) {
                _user.data.user = {};
                _user.data.verifyTelephone = true;
            } else {
                _user.data.verifyTelephone = false;
            }
        }
        cb(_user)
    })
}

// user login
exports.queryUserWithoutVerify = (telephone, password, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, _user => {
        cb(_user)
    })
}

// auto login by auth token
exports.autoLoginByTokenAuth = (token, cb) => {
    UserDao.autoLoginByTokenAuth(token, callback => {
        cb(callback)
    })
}

exports.resetTokenByToken = (token, cb) => {
    UserDao.resetTokenByToken(token, callback => {
        cb(callback);
    })
}

exports.isTokenValid = (token, cb) => {
    UserDao.isTokenValid(token, callback => {
        cb(callback);
    })
}

exports.isTelephoneExist = (telephone, cb) => {
    UserDao.isTelephoneExist(telephone, isExist => {
        cb(isExist)
    })
}

// reset user's password
exports.resetPassword = (telephone, cb) => {
    UserDao.resetPassword(telephone, newpwd, _result => {
        cb(_result)
    })
}

exports.updateDeviceID = (telephone, password, deviceID, cb) => {
    UserDao.updateDeviceID(telephone, password, deviceID, callback => {
        cb(callback)
    })
}

exports.getUserProfile = (userID, cb) => {
    UserDao.queryByUserID(userID, callback => {
        cb(callback)
    })
}

exports.uploadAvatar = (telephone, cb) => {
    let fileName = telephone + '-' + uuidv4() + '.jpg';
    QiniuProxie.uploadAvatar(fileName, '/avatar/avatar.jpg')
        .then(result => {
            cb(result);
        })
        .catch(err => {
            cb(err);
        })
}

/** User Friends Part */

exports.requestAddFriend = (userID, friendID, message, cb) => {
    IMProxie.sendContactNotification(userID, friendID, message, result => {
        if (!result.error) {
            cb({
                status: CodeConstants.SUCCESS,
                data: {},
                message: ""
            })
        } else {
            cb({
                status: CodeConstants.FAIL,
                data: {},
                message: result.error
            })
        }
    })
}

exports.addFriend = (userID, friendID, remarkName, cb) => {
    UserDao.addFriend(userID, friendID, remarkName || '', result => {
        if (result.status === CodeConstants.SUCCESS) {
            try {
                const message = "You've added him to be a friend";
                Promise.all([IMProxie.sendContactNotification(userID, friendID, message), IMProxie.sendContactNotification(friendID, userID, message)]);
            } catch (err) {
                result.status = CodeConstants.FAIL;
                result.data = {};
                result.message = err;
            }
        }
        cb(result)
    });
}

exports.deleteFriend = (userID, friendID, cb) => {
    UserDao.deleteFriend(userID, friendID, result => {
        // if (result.status === CodeConstants.SUCCESS) {
        //     IMProxie.deleteFriend(userID, friendID, _result => {
        //         let data = JSON.parse(_result);
        //         if (!data.error) {
        //             cb(result)
        //         } else {
        //             cb({
        //                 status: CodeConstants.FAIL,
        //                 data: {},
        //                 message: data.error
        //             })
        //         }
        //     })
        // } else {
        //     cb(result)
        // }
        cb(result);
    });
}

exports.updateRemarkName = (userID, friendID, remarkName, cb) => {
    UserDao.updateRemarkName(userID, friendID, remarkName, updateResult => {
        cb(updateResult);
    })
}

exports.getUserFriends = (userID, cb) => {
    UserDao.queryUserFriendsByUserID(userID, userList => {
        cb(userList);
    })
}

exports.searchUserByTelephoneOrNickname = (queryCondition, pageIndex, cb) => {
    UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        cb(searchResult);
    })
}

exports.getBlackList = (telephone, cb) => {
    // IMProxie.getBlacklist(telephone, _result => {
    //     let data = JSON.parse(_result);
    //     if (!data.error) {
    //         let telephoneList = data.data || [];
    //         UserDao.queryUserListByTelephone(telephoneList, userList => {
    //             cb(userList);
    //         })
    //     } else {
    //         cb({
    //             status: CodeConstants.FAIL,
    //             data: {},
    //             message: data.error
    //         })
    //     }
    // })
    cb([])
}

exports.searchUserByTelephoneOrNickname = (queryCondition, pageIndex, cb) => {
    UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        cb(searchResult);
    })
}

exports.getBlackList = (telephone, cb) => {
    // IMProxie.getBlacklist(telephone, _result => {
    //     let data = JSON.parse(_result);
    //     if (!data.error) {
    //         let telephoneList = data.data || [];
    //         UserDao.queryUserListByTelephone(telephoneList, userList => {
    //             cb(userList);
    //         })
    //     } else {
    //         cb({
    //             status: CodeConstants.FAIL,
    //             data: {},
    //             message: data.error
    //         })
    //     }
    // })
    cb([])
}