const UserService = require('../services/user.server.service')
const SMSService = require('../services/sms.server.service')
const RSAUtil = require('../utils/RSAUtil')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');
const fs = require('fs')

exports.login = (req, res, next) => {
    let data = req.body.params;

    let verifyCode = data.verifyCode;
    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.deviceID = data.deviceID;

    req.body.publicKey = data.clientPublicKey;

    console.log('[--LOGIN--]: ', data)
    if (verifyCode === '') {
        UserService.queryUserWithoutVerify(user.telephone, user.password, callback => {
            req.body.data = callback;
            next();
            // res.json(callback)
        })
    } else {
        SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN, validateCallback => {
            if (validateCallback.status === CodeConstants.SUCCESS) {
                UserService.updateDeviceID(user.telephone, user.password, user.deviceID, callback => {
                    req.body.data = callback;
                    next();
                    // res.json(callback)
                })
            } else {
                // res.json(result)
                req.body.data = validateCallback;
                next();
            }
        })
    }
}

exports.register = (req, res, next) => {
    let data = req.body.params;

    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.nickname = data.nickname;
    user.deviceID = data.deviceID;
    user.countryCode = data.countryCode || '';
    user.signature = data.signature || '';

    let verifyCode = data.verifyCode || '';

    req.body.publicKey = data.clientPublicKey;
    console.log('[--REGISTER--]: ', data)
    UserService.queryByTelephone(user.telephone, '', queryCallback => {
        if (queryCallback.status === CodeConstants.SUCCESS) {
            SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER, _sms => {
                if (_sms.status === CodeConstants.SUCCESS) {
                    UserService.createUser(user, callback => {
                        // return res.json(callback)
                        req.body.data = callback;
                        next();
                    })
                } else {
                    // return res.json(_sms)
                    req.body.data = _sms;
                    next();
                }
            })
        } else {
            // return res.json(queryCallback)
            req.body.data = queryCallback;
            next();
        }
    })
}

exports.autoLoginByTokenAuth = (req, res, next) => {
    let data = req.body.params;
    let token = data.token;
    req.body.publicKey = data.clientPublicKey;
    console.log('[--TOKEN AUTH--]', data);
    UserService.autoLoginByTokenAuth(token, callback => {
        req.body.data = callback;
        next();
        // return res.json(callback);
    })
}

exports.logout = (req, res, next) => {
    let data = req.body.params;
    let token = data.token;

    console.log('[--LOGOUT]--', data)
    UserService.resetTokenByToken(token, callback => {
        req.body.data = callback;
        next();
        // return res.json(callback);
    })
}

// test methods, need to delete it 
exports.queryByTelephone = (req, res, next) => {
    let telephone = req.params.telephone || '';
    UserService.queryByTelephone(telephone, callback => {
        return res.json(callback)
    })
}

/**
 * User profile update
 */
exports.resetPassword = (req, res, next) => {
    let data = req.body.params;

    let telephone = data.telephone;
    let verifyCode = data.verifyCode;

    UserService.resetPassword(telephone, callback => {
        return res.json(callback);
    })
}

exports.accessCommonToken = (req, res, next) => {
    let data = req.body;
    UserService.accessCommonToken(data.username, data.password, cb => {
        return res.json(cb)
    })
}