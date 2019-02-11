const SMSModel = require('../models/sms.model')
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');

class SMSRepository {
    /**
     * Save sms information
     * @param {string} telephone
     * @param {string} verifyCode
     * @param {string} codeType
     * @returns {Promise<{status: number, data: {skipVerify: boolean}, message: string}>}
     */
    async saveSMS(telephone, verifyCode, codeType) {
        let result = {status: FAIL, data: {skipVerify: false}, message: ""};
        const newDate = Date.now();
        const conditions = {telephone: telephone, codeType: codeType};
        const opts = {verifyCode: verifyCode, expiresAt: newDate};
        try {
            const updateResult = await SMSModel.findOneAndUpdate(conditions, opts).lean();

            if (updateResult) {
                console.log('---[SMS]---', updateResult);
                result.status = SUCCESS;
                result.data.verifyCode = verifyCode;
                result.data.expiresAt = newDate;
                result.message = 'Send SMS verify code success, expires time is 15 min'
            } else {
                const _sms = new SMSModel({telephone: telephone, verifyCode: verifyCode, codeType: codeType});
                const newSMSInfo = await _sms.save();
                result.status = SUCCESS;
                result.data.verifyCode = verifyCode;
                result.data.expiresAt = newSMSInfo.expiresAt;
                result.message = 'Send SMS verify code success, expires time is 15 min'
            }
        } catch (err) {
            result.data = {skipVerify: false};
            result.message = err;
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
