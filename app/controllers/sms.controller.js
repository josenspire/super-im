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
                    result = await login(telephone, verifyCode);
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

const login = async (telephone, verifyCode) => {
    const isTelephoneExist = await UserService.isTelephoneExist(telephone);
    if (isTelephoneExist) {
        // need to check sendSMS is in 60s ?
        await SMSService.sendSMS(telephone, verifyCode, Constants.SMS_TYPE_LOGIN);
    } else {
        throw new TError(FAIL, `Current account does not exist`);
    }
};

module.exports = new SMSController();
