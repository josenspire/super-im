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
            IMProxie.createUser(user.telephone, user.password, _cb => {
                let _result = JSON.parse(_cb)
                if (!_result.error) {
                    cb(createCallback);
                } else {
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

// 更新设备ID
exports.updateDeviceID = (telephone, password, deviceID, cb) => {
    UserDao.updateDeviceID(telephone, password, deviceID, callback => {
        cb(callback)
    })
}

exports.getUserProfile = (telephone, cb) => {
    let result = { data: {}, message: '' };
    UserDao.queryByTelephone(telephone, callback => {
        // if (callback.status === CodeConstants.SUCCESS) {
        //     IMProxie.getUser(telephone, _result => {
        //         let data = JSON.parse(_result)
        //         if (!data.error) {
        //             result.status = CodeConstants.SUCCESS;
        //         } else {
        //             status: CodeConstants.FAIL;
        //             result.message = data.error;
        //         }
        //         cb(data)
        //     })
        // } else {
        //     cb(callback)
        // }
        cb(callback)
    })
}

exports.getUserFriends = (telephone, cb) => {
    IMProxie.showFriends(telephone, _result => {
        let data = JSON.parse(_result)
        if (!data.error) {
            let telephoneList = data.data || [];
            UserDao.queryUserListByTelephone(telephoneList, userList => {
                cb(userList)
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

exports.getBlackList = (telephone, cb) => {
    IMProxie.getBlacklist(telephone, _result => {
        let data = JSON.parse(_result);
        if (!data.error) {
            let telephoneList = data.data || [];
            UserDao.queryUserListByTelephone(telephoneList, userList => {
                cb(userList)
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

exports.accessCommonToken = (username, password, cb) => {
    IMProxie.accessCommonToken(username, password, token => {
        cb(token)
    })
}