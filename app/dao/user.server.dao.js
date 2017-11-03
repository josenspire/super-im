const UserModel = require('../models/user.server.model')
const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')

const TokenModel = require('../models/token.server.model')
const TokenDao = require('./token.server.dao')

const uuidv4 = require('uuid/v4');

exports.createUser = async (user, cb) => {
    let result = { data: {}, message: '' };
    try {
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);
        let tokenModel = new TokenModel({ token: uuidv4(), user: _user._id });
        let _token = await TokenDao.tokenMethods.insertToken(tokenModel);
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
            result.data.token = await (TokenDao.tokenMethods.updateToken(data.user.token, uuidv4()));
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
exports.updateDeviceID = async (telephone, password, deviceID, cb) => {
    let result = { data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            result = await updateDeviceID(telephone, deviceID);
        } else {
            result.status = CodeConstants.FAIL;
            result.message = 'Telephone or password is incorrect';
        }
    } catch (err) {
        console.log(err)
        cb(err)
    }
    cb(result)
}

var updateDeviceID = (telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        let result = { data: {}, message: '' };
        UserModel.findOneAndUpdate({ telephone: telephone }, { deviceID: deviceID }, (user, err) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                result.status = CodeConstants.SUCCESS;
                user.deviceID = deviceID;
                result.data.user = user;
            }
            resolve(result);
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
            // .populate({ path: 'token', select: 'token' })
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
        UserModel.findByIdAndUpdate(userId, { $set: { token: tokenId } }, (err, _user) => {
            if (err) {
                console.log('--[UPDATE USER TOKEN FAIL]--', err);
                reject(err);
            } else {
                resolve(_user);
            }
        })
    })
}