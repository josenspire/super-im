const SMSService = require('../services/sms.server.service')
const UserService = require('../services/user.server.service')
const StringUtil = require('../utils/StringUtil');
const RSAUtil = require('../utils/RSAUtil')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');

exports.sendSMS = (req, res) => {
    let params = req.body.param;
    console.log(params)
    RSAUtil.privateDecrypt(params, result => {
        console.log('--[SMS PARAMS]--', result)
        let data = result.params;

        let clientPublicKey = data.clientPublicKey;
        let codeType = (data.codeType).toUpperCase();
        let telephone = data.telephone;
        let _data = data.data;

        let verifyCode = StringUtil.randomCodeString(5);

        try {
            switch (codeType) {
                case Constants.SMS_TYPE_REGISTER:
                    register(telephone, verifyCode, Constants.SMS_TYPE_REGISTER, callback => {
                        RSAUtil.publicEncryptObj(callback, clientPublicKey, _result => {
                            return res.json(_result)
                        })
                        // res.json(callback) 
                    });
                    break;
                case Constants.SMS_TYPE_LOGIN:
                    login(_data, telephone, verifyCode, Constants.SMS_TYPE_LOGIN, callback => {
                        RSAUtil.publicEncryptObj(callback, clientPublicKey, _result => {
                            return res.json(_result)
                        })
                        // res.json(callback)
                    });
                    break;
                case Constants.SMS_TYPE_OTHERS:
                    res.json('Others Type SMS')
                    break;
            }
        } catch (err) {
            console.log(err)
            RSAUtil.publicEncryptObj('SERVER_ERROR', clientPublicKey, _result => {
                return res.json(_result)
            })
        }
    })
}

exports.verifyCode = (req, res) => {
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

var register = (telephone, verifyCode, codeType, cb) => {
    UserService.queryByTelephone(telephone, codeType, queryCallback => {
        if (queryCallback.status === CodeConstants.SUCCESS) {
            SMSService.sendSMS(telephone, verifyCode, codeType, sms => {
                sms.data.skipVerify = false;
                cb(sms);
            })
        } else {
            cb(queryCallback)
        }
    })
}

var login = (user, telephone, verifyCode, codeType, cb) => {
    UserService.queryUser(user.telephone, user.password, user.deviceID, callback => {
        if (callback.status === CodeConstants.SUCCESS) {
            if (callback.data.verifyTelephone === true) {   // need to verify telephone
                SMSService.sendSMS(telephone, verifyCode, codeType, sms => {
                    cb(sms);
                })
            } else {
                cb({
                    status: CodeConstants.SUCCESS,
                    data: {
                        verifyCode: "",
                        skipVerify: true
                    },
                    message: ''
                })
            }
        } else {
            cb(callback)
        }
    })
}