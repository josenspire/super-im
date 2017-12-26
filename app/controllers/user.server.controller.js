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

    let verifyCode = data.verifyCode || "";
    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.deviceID = data.deviceID;

    console.log('[--LOGIN--]: ', data)
    if (verifyCode === "") {
        UserService.queryUserWithoutVerify(user.telephone, user.password, callback => {
            req.body.output = callback;
            next();
        })
    } else {
        SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN, validateCallback => {
            if (validateCallback.status === CodeConstants.SUCCESS) {
                UserService.updateDeviceID(user.telephone, user.password, user.deviceID, callback => {
                    req.body.output = callback;
                    next();
                })
            } else {
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
                        req.body.output = callback;
                        next();
                    })
                } else {
                    req.body.output = _sms;
                    next();
                }
            })
        } else {
            let result = { data: {} };
            result.status = CodeConstants.FAIL;
            result.message = isExist.message;
            req.body.output = result;
            next();
        }
    })
}

exports.isTokenValid = (req, res, next) => {
    let params = JSON.parse(req.body.params);
    let token = params.token;
    console.log('[--TOKEN AUTH--]', params);

    UserService.isTokenValid(token, callback => {
        return res.json(callback);
    })
}

exports.logout = (req, res, next) => {
    req.body.output = {
        status: CodeConstants.SUCCESS,
        data: {},
        message: ""
    };
    next();
}

/** User profile */
exports.resetPassword = (req, res, next) => {
    let data = req.body.input.params || {};

    let telephone = data.telephone;
    let verifyCode = data.verifyCode;

    UserService.resetPassword(telephone, callback => {
        return res.json(callback);
    })
}

exports.getUserProfile = (req, res, next) => {
    let input = req.body.input;

    let userID = input.targetUserID;
    UserService.getUserProfile(userID, userProfile => {
        req.body.output = userProfile;
        next();
    })
}

/** User avatar upload */
exports.uploadAvatar = (req, res, next) => {
    let userID = req.body.input.userID;

    atavarUpload.single('uploadAvatar')(req, res, async err => {
        if (err) {
            console.error(err)
            return res.json(err)
        }
        if (req.file) {
            let file = req.file;
            let fileName = userID + '-' + uuidv4() + '-' + file.filename;
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


/** User Contact Part */

exports.requestAddContact = (req, res, next) => {
    let input = req.body.input;
    let userID = input.userID;
    let contactID = input.contactID;
    let message = input.reason || "";
    UserService.requestAddContact(userID, contactID, message, inviteResult => {
        req.body.output = inviteResult;
        next();
    })
}

exports.acceptAddContact = (req, res, next) => {
    let input = req.body.input;
    let userID = input.userID;
    let contactID = input.contactID;
    let remarkName = input.remarkName;

    UserService.acceptAddContact(userID, contactID, remarkName, contactList => {
        req.body.output = contactList;
        next();
    })
}

exports.rejectAddContact = (req, res, next) => {
    let input = req.body.input;
    let userID = input.userID;
    let rejectUserID = input.rejectUserID;
    let rejectReason = input.reason || "";

    UserService.rejectAddContact(userID, rejectUserID, rejectReason, contactList => {
        req.body.output = contactList;
        next();
    })
}

exports.deleteContact = (req, res, next) => {
    let input = req.body.input;

    let userID = input.userID;
    let contactID = input.contactID;
    UserService.deleteContact(userID, contactID, deleteResult => {
        req.body.output = deleteResult;
        next();
    })
}

exports.updateRemarkName = (req, res, next) => {
    let input = req.body.input;

    let userID = input.userID;
    let contactID = input.contactID;
    let remarkName = input.remarkName;

    UserService.updateRemarkName(userID, contactID, remarkName, updateResult => {
        req.body.output = updateResult;
        next();
    })
}

exports.getUserContacts = (req, res, next) => {
    let userID = req.body.input.userID;
    UserService.getUserContacts(userID, userList => {
        req.body.output = userList;
        next();
    })
}

exports.getBlackList = (req, res, next) => {
    let input = req.body.input;
    let userID = input.userID;
    UserService.getBlackList(userID, userList => {
        req.body.output = userList;
        next();
    })
}

exports.searchUserByTelephoneOrNickname = (req, res, next) => {
    let input = req.body.input;
    let queryCondition = input.queryCondition || "";
    let pageIndex = parseInt(input.pageIndex) || 0;
    UserService.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        req.body.output = searchResult;
        next();
    })
}