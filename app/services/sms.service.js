const SMSRepository = require('../repositories/sms.repository')
const AliyunSMSUtil = require('../utils/AliyunSMSUtil');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

class SMSService {
    sendSMS (telephone, verifyCode, codeType) {
        // AliyunSMSUtil.sendSMS(telephone, verifyCode, _sms => {
        //     if (_sms.Code === 'OK') {
        //         SMSRepository.saveSMS(telephone, verifyCode, codeType, result => {
        //             cb(result)
        //         })
        //     } else {
        //         console.log(_sms)
        //         cb({
        //             status: FAIL,
        //             data: {},
        //             message: _sms.data.Message,
        //         })
        //     }
        // })
        return SMSRepository.saveSMS(telephone, verifyCode, codeType);
    };
    
    // validate record verify code
    validateRecord (telephone, verifyCode, codeType) {
        return SMSRepository.validateRecord(telephone, verifyCode, codeType);
    };
};

module.exports = new SMSService();
