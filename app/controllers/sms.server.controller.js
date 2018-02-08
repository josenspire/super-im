const SMSService = require('../services/sms.server.service')
const UserService = require('../services/user.server.service')
const StringUtil = require('../utils/StringUtil');
const RSAUtil = require('../utils/RSAUtil')
const { SUCCESS, FAIL } = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

exports.sendSMS = async (req, res, next) => {
    let data = req.data.input.params || {};
    let codeType = (data.codeType).toUpperCase();
    let telephone = data.telephone;
    let userInformation = data.data;
    let verifyCode = StringUtil.randomCodeString(5);
    let result = {};
    try {
        switch (codeType) {
            case Constants.SMS_TYPE_REGISTER:
                result = await register(telephone, verifyCode);
                break;
            case Constants.SMS_TYPE_LOGIN:
                result = await login(userInformation, telephone, verifyCode);
                break;
            case Constants.SMS_TYPE_OTHERS:
                return res.json('Others Type SMS')
        }
        req.data.output = result;
        next();
    } catch (err) {
        console.log(err)
        return res.json(err)
    }
}

exports.verifyCode = (req, res, next) => {
    let params = req.data.input.params || {};
    RSAUtil.privateDecrypt(params, data => {
        let clientPublicKey = data.clientPublicKey;
        let telephone = data.telephone;
        let verifyCode = data.verifyCode;
        let codeType = (data.codeType).toUpperCase();

        SMSService.validateRecord(telephone, verifyCode, codeType, verifyCallback => {
            RSAUtil.publicEncryptObj(verifyCallback, clientPublicKey, result => {
                return res.json(result)
            })
        })
    })
}

var register = (telephone, verifyCode) => {
    return new Promise((resolve, reject) => {
        UserService.isTelephoneExist(telephone, isExist => {
            if (isExist.status === false) {
                SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_REGISTER, sms => {
                    sms.data.skipVerify = false;
                    // cb(sms);
                    resolve(sms);
                })
            } else {
                resolve({
                    status: FAIL,
                    data: {},
                    message: isExist.message
                });
            }
        })
    })
}

var login = (user, telephone, verifyCode) => {
    return new Promise((resolve, reject) => {
        UserService.queryUserByTelephoneAndPassword(user.telephone, user.password, user.deviceID, callback => {
            if (callback.status === SUCCESS) {
                if (callback.data.verifyTelephone === true) {       // need to verify telephone
                    SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_LOGIN, sms => {
                        resolve(sms);
                    })
                } else {
                    resolve({
                        status: SUCCESS,
                        data: {
                            verifyCode: "",
                            skipVerify: true
                        },
                        message: ''
                    })
                }
            } else {
                resolve(callback)
            }
        })
    })
}