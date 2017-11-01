const UserModel = require('../models/user.server.model')
const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')

const uuidv4 = require('uuid/v4');

exports.createUser = (user, cb) => {
    let result = { data: {} };
    user.token = uuidv4();
    let _user = new UserModel(user);
    _user.save((err, _result) => {
        if (err) {
            console.log("[--CREATE USER--], ", err);
            let errMsg = err.errors
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            if (errMsg) {
                if (errMsg.telephone || errMsg.password) {
                    result.message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
                } else if (errMsg.nickname) {
                    result.message = errMsg.nickname.message;
                }
            } else {
                result.message = 'Sorry, server unknow error';
            }
        } else {
            result.status = CodeConstants.SUCCESS;
            result.data.user = _result;
            result.data.token = _result.token;
            result.data.secretKey = Constants.AES_SECRET;
            result.message = 'Registing user success'
        }
        cb(result)
    });
}

exports.queryUserByTelephoneAndPassword = async (telephone, password, cb) => {
    let result = { data: {}, message: '' };
    UserModel.findOne({ telephone: telephone }, (err, user) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (!user) {
            result.status = CodeConstants.FAIL;
            result.message = 'This telephone is no exist';
        } else {
            user.comparePassword(password, isMatch => {
                if (isMatch) {
                    result = await (updateToken(UserModel, telephone, uuidv4()));
                    // .then(_result => cb(_result));
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
    let result = { data: {}, message: '' };
    UserModel.findOne({ telephone: telephone }, (err, _user) => {
        if (err) {
            console.log(err)
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (_user) {
            console.log('---[UPDATE DEVICEID]---', _user);
            _user.comparePassword(password, isMatch => {
                if (isMatch)
                    updateDeviceID(UserModel, telephone, deviceID).then(_result => cb(_result))
                else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'Telephone or password is incorrect';
                }
            })
        } else if (!_user) {
            result.status = CodeConstants.FAIL;
            result.message = 'Telephone or password is incorrect';
        }
        cb(result)
    })
}

var updateDeviceID = (model, telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        let result = { data: {}, message: '' };
        model.findOneAndUpdate({ telephone: telephone }, { deviceID: deviceID }, (user, err) => {
            if (err) {
                console.log(err)
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else {
                user.deviceID = deviceID;
                result.status = CodeConstants.SUCCESS;
                result.data.user = user;
            }
            resolve(result);
        })
    })
}

var updateToken = (model, telephone, uuid) => {
    return new Promise((resolve, reject) => {
        let result = { data: {}, message: '' };
        UserModel.findOneAndUpdate({ telephone: telephone }, { token: uuid }, (err, user) => {
            if (err) {
                console.log('--[UPDATE TOKEN ERROR]--', err.message);
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else {
                result.status = CodeConstants.SUCCESS;
                result.data.user = user;
                result.data.token = uuid;
                result.data.secretKey = Constants.AES_SECRET;
            }
            resolve(result)
        })
    })
}