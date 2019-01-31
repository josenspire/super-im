const SMSService = require('../services/sms.server.service')
const UserService = require('../services/user.server.service')
const StringUtil = require('../utils/StringUtil');
const RSAUtil = require('../utils/RSAUtil')
const {SUCCESS, FAIL} = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

exports.sendSMS = async (req, res, next) => {
    const data = req.data.input.params || {};
    const codeType = (data.codeType).toUpperCase();
    const telephone = data.telephone;
    const userInformation = data.data;
    const verifyCode = StringUtil.randomCodeString(5);
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
};

exports.verifyCode = (req, res, next) => {
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