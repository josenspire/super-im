const UserDao = require('../dao/user.server.dao')
const CodeConstants = require('../utils/CodeConstants')
const SMSService = require('./sms.server.service')
let IMProxie = require('../api/proxies/user.im.server.proxies')

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

exports.queryByTelephone = (telephone, codeType, cb) => {
    let result = { data: {}, message: '' };
    UserDao.queryByTelephone(telephone, codeType, result => {
        if (result.status === CodeConstants.SUCCESS) {
            IMProxie.getUser(telephone, _result => {
                let data = JSON.parse(_result)
                if (!data.error) {
                    status: CodeConstants.FAIL;
                    result.message == 'This telephone is already exist';
                } else {
                    result.status = CodeConstants.SUCCESS;
                    result.message = ''
                }
                cb(result)
            })
        } else {
            cb(result)
        }
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

exports.accessCommonToken = (username, password, cb) => {
    IMProxie.accessCommonToken(username, password, token => {
        cb(token)
    })
}