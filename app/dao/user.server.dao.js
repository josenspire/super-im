const UserModel = require('../models/user.server.model')
const TokenModel = require('../models/token.server.model')
const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')

const uuidv4 = require('uuid/v4');

exports.createUser = async (user, cb) => {
    let result = { data: {}, message: '' };

    try {
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);

        let tokenModel = new TokenModel({ token: uuidv4(), expires: Date.now(), user: _user._id });

        let _token = await insertToken(tokenModel);
        let _updateUser = await updateUserModelTokenByUserId(userModel, _user._id, token._id);

        result.status = CodeConstants.SUCCESS;
        result.data.user = _updateUser;
        result.data.token = _token;
        result.data.secretKey = Constants.AES_SECRET;
    } catch (err) {
        console.log(err)
        cb(err)
        // if(err.status === CodeConstants.SERVER_UNKNOW_ERROR) {}
    }
}

exports.queryUserByTelephoneAndPassword = (telephone, password, cb) => {
    let result = { data: {}, message: '' };
    UserModel.findOne({ telephone: telephone })
        .populate('token')
        .exec((err, user) => {
            if (err) {
                console.log(err)
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
                cb(result)
            } else if (!user) {
                result.status = CodeConstants.FAIL;
                result.message = 'This telephone is no exist';
                cb(result)
            } else {
                user.comparePassword(password, async isMatch => {
                    if (isMatch) {
                        result = await (updateToken(user.token, uuidv4()));
                    } else {
                        result.status = CodeConstants.FAIL;
                        result.message = 'Sorry, Your password is invalid';
                    }
                    cb(result)
                })
            }
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

var insertUser = userModel => {
    let result = {
        status: null,
        message: ''
    };
    userModel.save((err, user) => {
        if (err) {
            console.log("[--CREATE USER FAIL--]", err);
            let errMsg = err.errors;
            if (errMsg) {
                if (errMsg.telephone || errMsg.password) {
                    result.message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
                } else if (errMsg.nickname) {
                    result.message = errMsg.nickname.message;
                }
                result.status = CodeConstants.FAIL;
            } else {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            }
            reject(result);
        } else {
            resolve(user);
        }
    });
}

var insertToken = tokenModel => {
    return new Promise((resolve, reject) => {
        tokenModel.save((err, data) => {
            if (err) {
                console.log('--[CREATE TOKEN FAIL]--', err)
                reject(err)
            } else {
                resolve(data);
            }
        })
    })
}

var updateToken = (_id, uuid) => {
    return new Promise((resolve, reject) => {
        let result = { data: {}, message: '' };
        TokenModel.findOneAndUpdate({ _id: _id }, { $set: { token: uuid, expires: Date.now() } }, (err, user) => {
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

var updateUserModelTokenByUserId = (userModel, userId, tokenId) => {
    return new Promise((resolve, reject) => {
        userModel.findByIdAndUpdate(userId, { $set: { token: tokenId } }, (err, _user) => {
            if (err) {
                console.log('--[UPDATE USER TOKEN FAIL]--', err);
                reject(err);
            } else {
                console.log('---------------', _user)
                resolve(_user);
            }
        })
    })
}