const UserDao = require('../dao/user.server.dao')
const SMSService = require('./sms.server.service')
const CodeConstants = require('../utils/CodeConstants')

let IMProxie = require('../api/proxies/user.server.proxies')
let QiniuProxie = require('../api/proxies/qiniu.server.proxies')

const uuidv4 = require('uuid/v4');

const fs = require('fs')

// create user
exports.createUser = (user, cb) => {
    UserDao.createUser(user, createCallback => {
        if (createCallback.status === CodeConstants.SUCCESS) {
            IMProxie.createUser(createCallback.data.user.userID, user.password, _cb => {
                let _result = JSON.parse(_cb)
                if (!_result.error) {
                    cb(createCallback);
                } else {
                    console.log('---[IM CRETEUSER FAIL]---', _result.error)
                    IMProxie.deleteUser(user.telephone, rollback => {
                        console.log('--[CREATE USER ROLLBACK]--', rollback)
                    })
                    cb({
                        status: CodeConstants.FAIL,
                        data: {},
                        message: _result.error
                    })
                }
            })
        } else {
            cb(createCallback)
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
    IMProxie.resetPassword(telephone, oldpwd, newpwd, result => {
        if (!callback.error) {
            UserDao.resetPassword(telephone, newpwd, _result => {
                if (_result.status != CodeConstants.SUCCESS) {
                    IMProxie.resetPassword(telephone, newpwd, oldpwd, rollback => {
                        console.log('--[RESET ROLLBACK]--', rollback)
                    })
                }
                cb(_result)
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

exports.addFriend = (userID, friendID, remarkName, cb) => {
    UserDao.addFriend(userID, friendID, remarkName || '', result => {
        if (result.status === CodeConstants.SUCCESS) {
            IMProxie.addFriend(userID, friendID, _result => {
                let data = JSON.parse(_result);
                if (!data.error) {
                    cb(result)
                } else {
                    cb({
                        status: CodeConstants.FAIL,
                        data: {},
                        message: data.error
                    })
                }
            })
        } else {
            cb(result)
        }
    });
}

exports.deleteFriend = (userID, friendID, cb) => {
    UserDao.deleteFriend(userID, friendID, result => {
        if (result.status === CodeConstants.SUCCESS) {
            IMProxie.deleteFriend(userID, friendID, _result => {
                let data = JSON.parse(_result);
                if (!data.error) {
                    cb(result)
                } else {
                    cb({
                        status: CodeConstants.FAIL,
                        data: {},
                        message: data.error
                    })
                }
            })
        } else {
            cb(result)
        }
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

exports.searchUserByTelephoneOrNickname = (queryCondition, cb) => {
    UserDao.searchUserByTelephoneOrNickname(queryCondition, searchResult => {
        cb(searchResult);
    })
}

exports.getBlackList = (telephone, cb) => {
    IMProxie.getBlacklist(telephone, _result => {
        let data = JSON.parse(_result);
        if (!data.error) {
            let telephoneList = data.data || [];
            UserDao.queryUserListByTelephone(telephoneList, userList => {
                cb(userList);
            })
        } else {
            cb({
                status: CodeConstants.FAIL,
                data: {},
                message: data.error
            })
        }
    })
}