const UserModel = require('../models/user.server.model')
const TokenModel = require('../models/token.server.model')

const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')
const SECRET = require('../utils/Constants').JWT_SECRET   // secret key

const jwt = require('jwt-simple')
const uuidv4 = require('uuid/v4');

exports.createUser = async (user, cb) => {
    let result = { data: {}, message: '' };
    try {
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);
        let tokenModel = new TokenModel({ token: uuidv4(), user: _user._id });
        let _token = await insertToken(tokenModel);
        let _updateUser = await updateUserTokenByUserId(_user._id, _token._id);

        result.status = CodeConstants.SUCCESS;
        result.data.user = _updateUser;
        result.data.token = _token.token;
        result.data.secretKey = Constants.AES_SECRET;
        cb(result)
    } catch (err) {
        console.log(err)
        cb(err)
    }
}

exports.queryUserByTelephoneAndPassword = async (telephone, password, cb) => {
    let result = { data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let _user = JSON.parse(JSON.stringify(data.user));
            delete _user.token;
            result.status = CodeConstants.SUCCESS;
            result.data.user = _user;
            result.data.token = await updateToken(data.user.token, uuidv4());
            result.data.secretKey = Constants.AES_SECRET;
        } else {
            result.status = CodeConstants.FAIL;
            result.message = 'Sorry, Your telephone or password is invalid';
        }
        cb(result)
    } catch (err) {
        console.log(err)
        cb(err)
    }
}

// check telephone is exist?
exports.queryByTelephone = (telephone, codeType, cb) => {
    let result = { data: {} };
    UserModel.findOne({ telephone: telephone, codeType: codeType || '' }, (err, user) => {
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
exports.updateDeviceID = async (telephone, password, deviceID, cb) => {
    let result = { data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let token = data.user.token.token;
            let _user = await updateDeviceID(telephone, deviceID);
            _user = JSON.parse(JSON.stringify(_user));
            delete _user.token;
            delete _user.meta;
            result.data.user = _user;
            result.data.secretKey = Constants.AES_SECRET;
            result.data.token = token;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.status = CodeConstants.FAIL;
            result.message = 'Telephone or password is incorrect';
        }
    } catch (err) {
        console.log('--[UPDATE DEVICEID FAIL]--', err)
        status = CodeConstants.FAIL;
        message = err;
    }
    cb(result)
}

exports.autoLoginByTokenAuth = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOne({ token: token })
        .populate('user')
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (!token) {
                result.status = CodeConstants.FAIL;
                result.message = 'This token is invalid, please login again';
            } else if (token) {
                if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now()))) {
                    let _user = JSON.parse(JSON.stringify(token.user));
                    delete _user.token;
                    result.status = CodeConstants.SUCCESS;
                    result.data.user = _user;
                    result.data.token = token.token;
                    result.data.secretKey = Constants.AES_SECRET;
                } else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'This token is expired, please login again';
                }
            }
            cb(result)
        })
}

exports.resetTokenByToken = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOneAndUpdate({ token: token }, { $set: { token: '' } })
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (token) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'The token is invalid'
            }
            cb(result)
        })
}

exports.resetPassword = (telephone, newPassword, cb) => {
    let result = { data: {}, message: '' };
    let password = jwt.encode(newPassword, SECRET);
    UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { password: password } })
        .exec((err, user) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (user) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'This telephone is no exist'
            }
            cb(result)
        })
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
        let opts = { loginTime: DateUtils.formatCommonUTCDate(Date.now()), token: uuid };
        TokenModel.findByIdAndUpdate(_id, { $set: opts })
            .exec(err => {
                if (err) {
                    console.log('--[UPDATE TOKEN ERROR]--', err.message);
                    reject(err)
                } else {
                    resolve(uuid)
                }
            })
    })
}

var updateDeviceID = (telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { deviceID: deviceID } }, (err, user) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                user.deviceID = deviceID;
            }
            resolve(user);
        })
    })
}

var insertUser = userModel => {
    return new Promise((resolve, reject) => {
        userModel.save((err, user) => {
            if (err) {
                console.log("[--CREATE USER FAIL--]", err);
                let message = '';
                let errMsg = err.errors;
                if (errMsg) {
                    if (errMsg.telephone || errMsg.password) {
                        message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
                    } else if (errMsg.nickname) {
                        message = errMsg.nickname.message;
                    }
                    // result.status = CodeConstants.FAIL;
                } else {
                    message = 'Sorry, server unknow error';
                }
                reject(message);
            } else {
                resolve(user);
            }
        });
    })
}

var queryUserByTelephoneAndPassword = (telephone, password) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .populate('token', 'token')
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    reject(err)
                } else if (!user) {
                    resolve('Sorry, Your telephone or password is invalid');
                } else {
                    user.comparePassword(password, async isMatch => {
                        resolve(isMatch ? { user: user, isMatch: true } : { isMatch: false })
                    })
                }
            })
    })
}

var updateUserTokenByUserId = (userId, tokenId) => {
    return new Promise((resolve, reject) => {
        UserModel.findByIdAndUpdate(userId, { $set: { token: tokenId } })
            .exec((err, _user) => {
                if (err) {
                    console.log('--[UPDATE USER TOKEN FAIL]--', err);
                    reject(err);
                } else {
                    resolve(_user);
                }
            })
    })
}