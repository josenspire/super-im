const SMSService = require('../services/sms.service')
const UserService = require('../services/user.service')
const StringUtil = require('../utils/StringUtil');
const RSAUtil = require('../utils/RSAUtil')
const {SUCCESS, FAIL} = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

class SMSController {
    async sendSMS(req, res, next) {
        const {params} = req.input || {};

        const codeType = (params.codeType).toUpperCase();
        const telephone = params.telephone;
        const verifyCode = StringUtil.randomCodeString(5);

        let result = {};
        try {
            switch (codeType) {
                case Constants.SMS_TYPE_REGISTER:
                    result = await register(telephone, verifyCode);
                    break;
                case Constants.SMS_TYPE_LOGIN:
                    if (!req.user) {
                        throw new Error(`User information missing, please input your username and password`);
                    }
                    result = await login(req.user, telephone, verifyCode);
                    break;
                case Constants.SMS_TYPE_OTHERS:
                    return res.json('Others Type SMS')
            }
        } catch (err) {
            result = {
                status: FAIL,
                data: {},
                message: err.message,
            };
        }
        req.output = result;
        next();
    };

    verifyCode(req, res, next) {
        const params = req.data.input.params || {};
        RSAUtil.privateDecrypt(params, async data => {
            const clientPublicKey = data.clientPublicKey;
            const telephone = data.telephone;
            const verifyCode = data.verifyCode;
            const codeType = (data.codeType).toUpperCase();

            const verifyCallback = await SMSService.validateRecord(telephone, verifyCode, codeType);
            RSAUtil.publicEncryptObj(verifyCallback, clientPublicKey, result => {
                return res.json(result)
            });
        });
    };

};

var register = async (telephone, verifyCode) => {
    const isExist = await UserService.isTelephoneExist(telephone);
    if (isExist.status === false) {
        const sms = await SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_REGISTER);
        sms.data.skipVerify = false;
        return sms;
    } else {
        return {
            status: FAIL,
            data: {},
            message: isExist.message,
        };
    }
};

var login = async (user, telephone, verifyCode) => {
    const queryResult = await UserService.queryUserByTelephoneAndPassword(user.telephone, user.password, user.deviceID);
    if (queryResult.status === SUCCESS) {
        if (queryResult.data.verifyTelephone === true) {       // need to verify telephone
            const sms = await SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_LOGIN);
            return sms;
        } else {
            return {
                status: SUCCESS,
                data: {
                    verifyCode: "",
                    skipVerify: true
                },
                message: ''
            };
        }
    }
    return queryResult;
};

module.exports = new SMSController();
