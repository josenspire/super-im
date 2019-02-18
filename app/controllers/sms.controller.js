const SMSService = require('../services/sms.service');
const UserService = require('../services/user.service');
const StringUtil = require('../utils/StringUtil');
const {SUCCESS, FAIL} = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');
const {success, error} = require('../commons/response.common');
const TError = require('../commons/error.common');

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
                        throw new TError(FAIL, `User information missing, please input your username and password`);
                    }
                    result = await login(req.user, telephone, verifyCode);
                    break;
                case Constants.SMS_TYPE_OTHERS:
                    return res.json('Others Type SMS')
            }
            req.output = success(result, "Send SMS verify code success, expires time is 15 min");
        } catch (err) {
            req.output = error(err);
        }
        next();
    };

    async verifyCode(req, res, next) {
        const {params} = req.input;
        const {telephone, verifyCode, codeType} = params;
        try {
            const verifyResult = await SMSService.validateRecord(telephone, verifyCode, codeType.toUpperCase());
            res.output = success(verifyResult);
        } catch (err) {
            res.output = error(err);
        }
        next();
    };
}

const register = async (telephone, verifyCode) => {
    const isExist = await UserService.isTelephoneExist(telephone);
    if (!isExist) {
        return await SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_REGISTER);
    } else {
        throw new TError(FAIL, "This telephone is already register");
    }
};

const login = async (user, telephone, verifyCode) => {
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
