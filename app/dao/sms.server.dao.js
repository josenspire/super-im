const SMSModel = require('../models/sms.server.model')
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");

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
                const newSMSInfo = await smsModel.save(_sms).lean();
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
     * Validate record
     * @param {string} telephone
     * @param {string} verifyCode
     * @param {string} codeType
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async validateRecord(telephone, verifyCode, codeType) {
        let result = {status: FAIL, data: {}, message: ""};
        try {
            const _sms = await SMSModel.findOne({telephone: telephone, codeType: codeType}).lean();
            if (_sms) {
                if (verifyCode === _sms.verifyCode) {
                    result.status = SUCCESS;
                    result.data.verifyCode = verifyCode;
                    result.message = 'The SMS verify code validate success';
                } else {
                    result.message = 'The SMS verify code validation invalid';
                }
            } else if (!_sms) {
                result.message = 'The verify code is expires, please get the code again'
            }
        } catch (err) {
            console.log(err)
            result.status = SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        }
        return result;
    }
};

module.exports = new SMSRepository();
