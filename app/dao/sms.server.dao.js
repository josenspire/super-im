const SMSModel = require('../models/sms.server.model')
const CodeConstants = require('../utils/CodeConstants')

// save verifyCode
exports.saveSMS = (telephone, verifyCode, codeType, cb) => {
    let result = {
        data: { skipVerify: false }
    };
    let newDate = Date.now();
    let _sms = new SMSModel({ telephone: telephone, verifyCode: verifyCode, codeType: codeType });
    SMSModel.findOneAndUpdate({ telephone: telephone, codeType: codeType }, { verifyCode: verifyCode, expiresAt: newDate }, (err, _result) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
            cb(result)
        } else if (_result) {
            result.status = CodeConstants.SUCCESS;
            console.log('---[SMS]---', _result);
            result.data.verifyCode = verifyCode;
            result.data.expiresAt = newDate;
            result.message = 'Send SMS verify code success, expires time is 15 min'
            cb(result)
        } else if (!_result) {
            _sms.save((err, _result) => {
                if (err) {
                    console.log(err)
                    result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                    result.message = 'Sorry, server unknow error';
                } else {
                    result.status = CodeConstants.SUCCESS;
                    result.data.verifyCode = verifyCode;
                    result.data.expiresAt = _result.expiresAt;
                    result.message = 'Send SMS verify code success, expires time is 15 min'
                }
                cb(result)
            });
        }
    });
}

// check telephone and verifyCode
exports.validateRecord = (telephone, verifyCode, codeType, cb) => {
    console.log('--[VALIDATE CODE]--', telephone, verifyCode, codeType);
    let result = { data: {} };
    SMSModel.findOne({ telephone: telephone, codeType: codeType }, (err, _sms) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (_sms) {
            if (verifyCode === _sms.verifyCode) {
                result.data.verifyCode = verifyCode;
                result.status = CodeConstants.SUCCESS;
                result.message = 'The SMS verify code validate success';
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'The SMS verify code validation invalid';
            }
        } else if (!_sms) {
            result.status = CodeConstants.FAIL;
            result.message = 'The verify code is expires, please get the code again'
        }
        cb(result)
    })
}