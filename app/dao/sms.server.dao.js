const SMSModel = require('../models/sms.server.model')
const CodeConstants = require('../utils/CodeConstants')

// save verifyCode
exports.saveSMS = async (telephone, verifyCode, codeType, cb) => {
    let result = {
        status: CodeConstants.FAIL,
        data: { skipVerify: false },
        message: ""
    };
    let newDate = Date.now();
    let conditions = { telephone: telephone, codeType: codeType };
    let opts = { verifyCode: verifyCode, expiresAt: newDate };
    try {
        let updateResult = await findAndUpdateSMSInfo(conditions, opts);
        if (updateResult) {
            console.log('---[SMS]---', updateResult);
            result.status = CodeConstants.SUCCESS;
            result.data.verifyCode = verifyCode;
            result.data.expiresAt = newDate;
            result.message = 'Send SMS verify code success, expires time is 15 min'
        } else {
            let _sms = new SMSModel({ telephone: telephone, verifyCode: verifyCode, codeType: codeType });
            let newSMSInfo = await saveSMSInformation(_sms);
            result.status = CodeConstants.SUCCESS;
            result.data.verifyCode = verifyCode;
            result.data.expiresAt = newSMSInfo.expiresAt;
            result.message = 'Send SMS verify code success, expires time is 15 min'
        }
    } catch (err) {
        result.data = { skipVerify: false };
        result.message = err;
    }
    cb(result);
}

// check telephone and verifyCode
exports.validateRecord = (telephone, verifyCode, codeType, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: "" };
    SMSModel.findOne({ telephone: telephone, codeType: codeType }, (err, _sms) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (_sms) {
            if (verifyCode === _sms.verifyCode) {
                result.status = CodeConstants.SUCCESS;
                result.data.verifyCode = verifyCode;
                result.message = 'The SMS verify code validate success';
            } else {
                result.message = 'The SMS verify code validation invalid';
            }
        } else if (!_sms) {
            result.message = 'The verify code is expires, please get the code again'
        }
        cb(result)
    })
}

var findAndUpdateSMSInfo = (conditions, opts) => {
    return new Promise((resolve, reject) => {
        SMSModel.findOneAndUpdate(conditions, opts, (err, result) => {
            if (err) {
                console.log("---[SMS]---", err)
                reject("Sorry, server unknow error");
            } else {
                resolve(result);
            }
        })
    })
}

var saveSMSInformation = smsModel => {
    return new Promise((resolve, reject) => {
        smsModel.save((err, result) => {
            if (err) {
                reject("Sorry, server unknow error");
            } else {
                resolve(result)
            }
        });
    })
}