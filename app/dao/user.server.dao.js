const UserModel = require('../models/user.server.model')
const TokenUtil = require('../utils/TokenUtil')
const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')

// register
exports.createUser = (user, cb) => {
    let result = { data: {} };
    user.token = TokenUtil.createToken();
    let _user = new UserModel(user);
    _user.save((err, _result) => {
        if (err) {
            let errMsg = err.errors
            console.log("[--CREATE USER--], ", err);
            if (errMsg) {
                if (errMsg.telephone || errMsg.password) {
                    result.message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
                } else if (errMsg.nickname) {
                    result.message = errMsg.nickname.message;
                }
            }
            result.message = 'Sorry, server unknow error';
            result.status = CodeConstants.FAIL;
        } else {
            result.status = CodeConstants.SUCCESS;
            result.data.user = _result;
            result.data.secretKey = Constants.AES_SECRET;
            result.message = 'Registing user success'
        }
        cb(result)
    });
}

// query user by name & password
exports.queryUser = (telephone, password, cb) => {
    let result = { data: {} };
    UserModel.findOne({ telephone: telephone }, (err, user) => {
        if (err) {
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (!user) {
            result.status = CodeConstants.FAIL;
            result.message = 'This telephone is no exist';
        } else {
            user.comparePassword(password, isMatch => {
                if (isMatch) {
                    user.resetExpires();    // reset token expires time
                    result.status = CodeConstants.SUCCESS;
                    result.data.user = user;
                    result.data.secretKey = Constants.AES_SECRET;
                    result.message = 'Telephone and password validate success';
                } else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'Sorry, Your password is invalid';
                }
            })
        }
        cb(result)
    })
}

// check token is expires?
exports.checkTokenExpires = (token, cb) => {
    let result = { data: {} };
    UserModel.findOne({ token: token }, (err, user) => {
        if (err) {
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (!user) {
            result.status = CodeConstants.FAIL;
            result.message = 'This token is no exist';
        } else if (user) {
            if (DateUtils.compareDate(user.expires, Date.now())) {
                result.status = CodeConstants.SUCCESS;
                result.data = user;
                result.message = 'Token is effective';
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'Token is expired';
            }
        }
        cb(result)
    })
}

// check telephone is exist?
exports.queryByTelephone = (telephone, codeType, cb) => {
    let result = { data: {} };
    UserModel.findOne({ telephone: telephone, codeType: codeType | '' }, (err, user) => {
        if (err) {
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (user) {
            result.status = CodeConstants.FAIL;
            result.data = user;
            result.message = 'The telephone is already exist';
        } else {
            result.status = CodeConstants.SUCCESS;
            result.message = 'The telephone is valid'
        }
        cb(result)
    })
}

// update deviceID 
exports.updateDeviceID = (telephone, password, deviceID, cb) => {
    let result = { data: {} };
    UserModel.findOne({ telephone: telephone }, (err, _user) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (_user) {
            _user.comparePassword(password, isMatch => {
                if (isMatch) {
                    UserModel.update({ telephone: telephone }, { deviceID: deviceID }, err => {
                        if (err) {
                            console.log(err)
                            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                            result.message = 'Sorry, server unknow error';
                        } else {
                            console.log('---[UPDATE DEVICEID]---', _user);
                            _user.deviceID = deviceID;
                            result.status = CodeConstants.SUCCESS;
                            result.data.user = _user;
                            result.message = ''
                        }
                        cb(result)
                    })
                }
            })
        } else if (!_user) {
            result.status = CodeConstants.FAIL;
            result.message = 'Telephone or password is incorrect';
            cb(result)
        }
    })
}