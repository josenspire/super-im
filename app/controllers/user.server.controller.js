const UserService = require('../services/user.server.service')
const SMSService = require('../services/sms.server.service')
const RSAUtil = require('../utils/RSAUtil')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');
const fs = require('fs')

exports.login = (req, res) => {
    let params = req.body.param;
    RSAUtil.privateDecrypt(params, result => {
        let data = result.params;
        let clientPublicKey = data.clientPublicKey;
        let verifyCode = data.verifyCode;

        let user = {};
        user.telephone = data.telephone;
        user.password = data.password;
        user.deviceID = data.deviceID;
        console.log('[--LOGIN--]: ', data)
        if (verifyCode === '') {
            UserService.queryUserWithoutVerify(user.telephone, user.password, callback => {
                RSAUtil.publicEncryptObj(callback, clientPublicKey, result => {
                    return res.json(result)
                })
            })
        } else {
            SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN, validateCallback => {
                if (validateCallback.status === CodeConstants.SUCCESS) {
                    console.log('-----------------', validateCallback)
                    UserService.updateDeviceID(user.telephone, user.password, user.deviceID, callback => {
                        console.log('-----------------')
                        RSAUtil.publicEncryptObj(callback, clientPublicKey, result => {
                            res.json(result)
                        })
                    })
                } else {
                    RSAUtil.publicEncryptObj(validateCallback, clientPublicKey, result => {
                        res.json(result)
                    })
                }
            })
        }
    })
}

exports.register = (req, res) => {
    let params = req.body.param;
    RSAUtil.privateDecrypt(params, result => {
        let data = result.params;
        let user = {};
        user.telephone = data.telephone;
        user.password = data.password;
        user.nickname = data.nickname;
        user.deviceID = data.deviceID;
        user.countryCode = data.countryCode | '';
        user.signature = data.signature | '';

        let verifyCode = data.verifyCode;
        let clientPublicKey = data.clientPublicKey;
        console.log('[--REGISTER--]: ', data)
        UserService.queryByTelephone(user.telephone, '', queryCallback => {
            if (queryCallback.status === CodeConstants.SUCCESS) {
                SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER, _sms => {
                    if (_sms.status === CodeConstants.SUCCESS) {
                        UserService.createUser(user, callback => {
                            RSAUtil.publicEncryptObj(callback, clientPublicKey, result => {
                                return res.json(result)
                            })
                        })
                    } else {
                        RSAUtil.publicEncryptObj(_sms, clientPublicKey, result => {
                            return res.json(result)
                        })
                        // return res.json(_sms)
                    }
                })
            } else {
                // return res.json(queryCallback)
                RSAUtil.publicEncryptObj(queryCallback, clientPublicKey, result => {
                    return res.json(result)
                })
            }
        })
    })
}

exports.tokenAuth = (req, res) => {
    let token = req.params.token;
    // RSAUtil.privateDecrypt(data, callback => {
    //     user = callback;
    // })
    console.log('[--TOKEN AUTH--]', token)
    UserService.tokenAuth(token, callback => {
        // RSAUtil.privateEncryptObj(callback, result => {
        //     return res.json(result)
        // })
        return res.json(callback)
    })
}

exports.logout = (req, res) => {
    let user = req.body.param
    console.log('[--LOGOUT]--', user)
    UserService.logout(user.telephone, callback => {
        return res.json(callback);
    })
}

exports.queryByTelephone = (req, res) => {
    let telephone = req.params.telephone || '';
    UserService.queryByTelephone(telephone, callback => {
        return res.json(callback)
    })
}

exports.resetPassword = (req, res) => {
    let telephone = req.params.telephone || '';
    UserService.resetPassword(telephone, callback => {
        return res.json(callback);
    })
}