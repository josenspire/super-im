const SMSModel = require('../models/sms.model')
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');

class SMSRepository {
    /**
     * Save sms information
     * @param {string} telephone
     * @param {string} verifyCode
     * @param {string} codeType
     * @returns {Promise<{verifyCode: string, expiresAt: null}>}
     */
    async saveSMS(telephone, verifyCode, codeType) {
        let result = {
            verifyCode: "",
            expiresAt: null,
        };
        const newDate = Date.now();
        const opts = {verifyCode: verifyCode, expiresAt: newDate};
        try {
            const updateResult = await SMSModel.findOneAndUpdate({telephone, codeType}, opts).lean();
            if (updateResult) {
                console.log('---[SMS]---', updateResult);
                result.verifyCode = verifyCode;
                result.expiresAt = newDate;
            } else {
                const newSMSInfo = await new SMSModel({telephone, verifyCode, codeType}).save();
                result.verifyCode = verifyCode;
                result.expiresAt = newSMSInfo.expiresAt;
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, "Server error, Send SMS verify code fail");
        }
        return result;
    };

    /**
     * Validate sms code
     * @param telephone
     * @param verifyCode
     * @param codeType
     * @returns {Promise<object>}
     */
    async validateRecord(telephone, verifyCode, codeType) {
        const _sms = await SMSModel.findOne({telephone, codeType}).lean();
        if (_sms) {
            if (verifyCode === _sms.verifyCode) {
                return _sms;
            } else {
                throw new TError(FAIL, 'The SMS verify code validation invalid');
            }
        } else {
            throw new TError(FAIL, 'The verify code is expires, please get the code again');
        }
    }
};

module.exports = new SMSRepository();
