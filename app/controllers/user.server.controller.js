const UserService = require('../services/user.server.service')
const SMSService = require('../services/sms.server.service')
const RSAUtil = require('../utils/RSAUtil')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');
const fs = require('fs')

const uuidv4 = require('uuid/v4');
const atavarUpload = require('../api/commons/upload.server.common')
const QiniuProxie = require('../api/proxies/qiniu.server.proxies')

exports.getPublicKey = (req, res, next) => {
    return res.json({
        status: CodeConstants.SUCCESS,
        data: {
            secretKey: RSAUtil.getPublicKey()
        },
        message: ''
    })
}

exports.login = (req, res, next) => {
    let data = req.body.input.params || {};

    let verifyCode = data.verifyCode;
    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.deviceID = data.deviceID;

    console.log('[--LOGIN--]: ', data)
    if (verifyCode === '') {
        UserService.queryUserWithoutVerify(user.telephone, user.password, callback => {
            req.body.output = callback;
            next();
            // res.json(callback)
        })
    } else {
        SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN, validateCallback => {
            if (validateCallback.status === CodeConstants.SUCCESS) {
                UserService.updateDeviceID(user.telephone, user.password, user.deviceID, callback => {
                    req.body.output = callback;
                    next();
                    // res.json(callback)
                })
            } else {
                // res.json(result)
                req.body.output = validateCallback;
                next();
            }
        })
    }
}

exports.register = (req, res, next) => {
    let data = req.body.input.params || {};

    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.nickname = data.nickname;
    user.deviceID = data.deviceID;
    user.countryCode = data.countryCode || '';
    user.signature = data.signature || '';

    let verifyCode = data.verifyCode || '';

    console.log('[--REGISTER--]: ', data)
    UserService.isTelephoneExist(user.telephone, isExist => {
        if (isExist.status === false) {
            SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER, _sms => {
                if (_sms.status === CodeConstants.SUCCESS) {
                    UserService.createUser(user, callback => {
                        // return res.json(callback)
                        req.body.output = callback;
                        next();
                    })
                } else {
                    // return res.json(_sms)
                    req.body.output = _sms;
                    next();
                }
            })
        } else {
            // return res.json(isExist)
            let result = { data: {} };
            result.status = CodeConstants.FAIL;
            result.message = isExist.message;
            req.body.output = result;
            next();
        }
    })
}

exports.autoLoginByTokenAuth = (req, res, next) => {
    let data = req.body.input.params || {};
    let token = data.token;

    console.log('[--TOKEN AUTH--]', data);
    UserService.autoLoginByTokenAuth(token, callback => {
        req.body.output = callback;
        next();
        // return res.json(callback);
    })
}

exports.logout = (req, res, next) => {
    let data = req.body.input.params || {};
    let token = data.token;

    console.log('[--LOGOUT]--', data)
    UserService.resetTokenByToken(token, callback => {
        req.body.output = callback;
        next();
        // return res.json(callback);
    })
}

/**
 * User profile update
 */
exports.resetPassword = (req, res, next) => {
    let data = req.body.input.params || {};

    let telephone = data.telephone;
    let verifyCode = data.verifyCode;

    UserService.resetPassword(telephone, callback => {
        return res.json(callback);
    })
}

exports.getUserProfile = (req, res, next) => {
    let telephone = req.body.input.telephone;
    UserService.getUserProfile(telephone, userProfile => {
        // req.body.output = userProfile;
        return res.json(userProfile);
    })
}

exports.getUserFriends = (req, res, next) => {
    let telephone = req.body.input.telephone;
    UserService.getUserFriends(telephone, userList => {
        return res.json(userList);
    })
}

exports.getBlackList = (req, res, next) => {
    let telephone = req.body.input.telephone;
    UserService.getBlackList(telephone, userList => {
        return res.json(userList);
    })
}

exports.uploadAvatar = (req, res, next) => {
    // let telephone = req.body.input.telephone;

    let telephone = "13631270436";

    atavarUpload.single('uploadAvatar')(req, res, async err => {
        if (err) {
            console.error(err)
            return res.json(err)
        }
        if (req.file) {
            let file = req.file;
            let fileName = telephone + '-' + uuidv4() + '-' + file.filename;

            try {
                let result = await QiniuProxie.uploadAvatar(fileName, file.path);

                return res.json(result)
            } catch (err) {
                return res.json(err)
            }
        } else {
            return res.json('FAIL')
        }
    })
}

exports.accessCommonToken = (req, res, next) => {
    let data = req.body;
    UserService.accessCommonToken(data.telephone, data.password, cb => {
        return res.json(cb)
    })
}

exports.addFriend = (req, res, next) => {
    let userID = req.body.input.userID;
    let friendID = req.body.input.firendID;

    UserService.addFriend(userID, friendID, result => {
        
    })
}