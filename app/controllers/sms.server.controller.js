const SMSService = require('../services/sms.server.service')
const UserService = require('../services/user.server.service')
const StringUtil = require('../utils/StringUtil');
const RSAUtil = require('../utils/RSAUtil')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');

exports.sendSMS = (req, res, next) => {
    let data = req.body.params;
    let clientPublicKey = data.clientPublicKey;
    let codeType = (data.codeType).toUpperCase();
    let telephone = data.telephone;
    let userInformation = data.data;

    let verifyCode = StringUtil.randomCodeString(5);

    req.body.publicKey = data.clientPublicKey;

    try {
        switch (codeType) {
            case Constants.SMS_TYPE_REGISTER:
                register(telephone, verifyCode, Constants.SMS_TYPE_REGISTER)
                    .then(result => {
                        // return res.json(result);
                        req.body.data = result;
                        next();
                    })
                break;
            case Constants.SMS_TYPE_LOGIN:
                login(userInformation, telephone, verifyCode, Constants.SMS_TYPE_LOGIN)
                    .then(result => {
                        // return res.json(result);
                        req.body.data = result;
                        next();
                    })
                break;
            case Constants.SMS_TYPE_OTHERS:
                res.json('Others Type SMS')
                break;
        }
    } catch (err) {
        console.log(err)
        return res.json(err)
    }
}

exports.verifyCode = (req, res, next) => {
    let params = req.body.param;
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

var register = (telephone, verifyCode, codeType) => {
    return new Promise((resolve, reject) => {
        UserService.queryByTelephone(telephone, codeType, queryCallback => {
            if (queryCallback.status === CodeConstants.SUCCESS) {
                SMSService.sendSMS(telephone, verifyCode, codeType, sms => {
                    sms.data.skipVerify = false;
                    // cb(sms);
                    resolve(sms);
                })
            } else {
                resolve(queryCallback);
            }
        })
    })
}

var login = (user, telephone, verifyCode, codeType) => {
    return new Promise((resolve, reject) => {
        UserService.queryUserByTelephoneAndPassword(user.telephone, user.password, user.deviceID, callback => {
            if (callback.status === CodeConstants.SUCCESS) {
                if (callback.data.verifyTelephone === true) {   // need to verify telephone
                    SMSService.sendSMS(telephone, verifyCode, codeType, sms => {
                        resolve(sms);
                    })
                } else {
                    resolve({
                        status: CodeConstants.SUCCESS,
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