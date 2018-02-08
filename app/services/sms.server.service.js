const SMSDao = require('../dao/sms.server.dao')
const AliyunSMSUtil = require('../utils/AliyunSMSUtil');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

// save sms verify code
exports.sendSMS = (telephone, verifyCode, codeType, cb) => {
    // AliyunSMSUtil.sendSMS(telephone, verifyCode, _sms => {
    //     if (_sms.Code === 'OK') {
    //         SMSDao.saveSMS(telephone, verifyCode, codeType, result => {
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
    SMSDao.saveSMS(telephone, verifyCode, codeType, result => {
        cb(result)
    })
}

// validate record verify code
exports.validateRecord = (telephone, verifyCode, codeType, cb) => {
    SMSDao.validateRecord(telephone, verifyCode, codeType, _result => {
        cb(_result)
    })
}