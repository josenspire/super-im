const UserService = require('../services/user.server.service')
const GroupService = require('../services/group.server.service')
const SMSService = require('../services/sms.server.service')
const RSAUtil = require('../utils/RSAUtil')
const { SUCCESS, FAIL } = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

const fs = require('fs')
const multiparty = require('multiparty');
const uuidv4 = require('uuid/v4');
const atavarUpload = require('../api/commons/upload.server.common')
const QiniuProxie = require('../api/proxies/qiniu.server.proxies')

exports.getPublicKey = (req, res, next) => {
    return res.json({
        status: SUCCESS,
        data: {
            secretKey: RSAUtil.getPublicKey()
        },
        message: ''
    })
}

exports.login = (req, res, next) => {
    let data = req.data.input.params || {};

    let verifyCode = data.verifyCode || "";
    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.deviceID = data.deviceID;

    if (verifyCode === "") {
        UserService.queryUserWithoutVerify(user.telephone, user.password, callback => {
            req.data.output = callback;
            next();
        })
    } else {
        SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN, validateCallback => {
            if (validateCallback.status === SUCCESS) {
                UserService.updateDeviceID(user.telephone, user.password, user.deviceID, callback => {
                    req.data.output = callback;
                    next();
                })
            } else {
                req.data.output = validateCallback;
                next();
            }
        })
    }
}

exports.register = (req, res, next) => {
    let data = req.data.input.params || {};

    let user = {};
    user.telephone = data.telephone;
    user.password = data.password;
    user.nickname = data.nickname;
    user.sex = data.sex || 0;
    user.birthday = data.birthday || 0;
    user.location = data.location || '';
    user.signature = data.signature || '';
    user.countryCode = data.countryCode || '';
    user.deviceID = data.deviceID;

    let verifyCode = data.verifyCode || '';

    console.log('[--REGISTER--]: ', data)
    UserService.isTelephoneExist(user.telephone, isExist => {
        if (isExist.status === false) {
            SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER, _sms => {
                if (_sms.status === SUCCESS) {
                    UserService.createUser(user, callback => {
                        req.data.output = callback;
                        next();
                    })
                } else {
                    req.data.output = _sms;
                    next();
                }
            })
        } else {
            let result = { data: {} };
            result.status = FAIL;
            result.message = isExist.message;
            req.data.output = result;
            next();
        }
    })
}

exports.tokenVerifyLogin = (req, res, next) => {
    let data = JSON.parse(req.body);
    // let data = req.body;
    let token = data.token;
    console.log('[--TOKEN AUTH--]', token);

    UserService.tokenVerifyLogin(token, callback => {
        return res.json(callback);
    })
}

exports.logout = (req, res, next) => {
    req.data.output = {
        status: SUCCESS,
        data: {},
        message: ""
    };
    next();
}

/** User profile */
exports.resetPassword = (req, res, next) => {
    let data = req.data.input.params || {};

    let telephone = data.telephone;
    let verifyCode = data.verifyCode;

    UserService.resetPassword(telephone, callback => {
        return res.json(callback);
    })
}

exports.getUserProfile = (req, res, next) => {
    let input = req.data.input;
    let userID = input.targetUserID;
    UserService.getUserProfile(userID, userProfile => {
        req.data.output = userProfile;
        next();
    })
}

exports.updateUserProfile = (req, res, next) => {
    let input = req.data.input;
    let userID = input.userID;
    let userProfile = {
        nickname: input.nickname || "",
        birthday: input.birthday || "",
        signature: input.signature || "",
        location: input.location || "",
        sex: parseInt(input.sex) || 0,
    };
    UserService.updateUserProfile(userID, userProfile, updateResult => {
        req.data.output = updateResult;
        next();
    })
}

/** User avatar upload */
exports.uploadAvatar = (req, res, next) => {
    let result = { status: FAIL, data: {}, message: "" };

    atavarUpload.single('uploadAvatar')(req, res, async err => {
        if (err) {
            console.error("---[Upload avatar error]---", err)
            result.message = err;
        } else if (req.file) {
            let file = req.file;
            let data = req.body;
            console.log("===[REQUEST DATA]===", data)

            let fileName = file.filename;
            try {
                let uploadAvatarResult = await QiniuProxie.uploadAvatar(fileName, file.path);
                result.status = SUCCESS;
                result.data = {
                    avatarUrl: Constants.QN_DEFAULT_EXTERNAL_LINK + uploadAvatarResult.key,
                    width: "200",
                    height: "200"
                };
            } catch (err) {
                result.message = err;
            }
        } else {
            result.message = "Parameters is incompleteness";
        }
        return res.json(result);
    })
}

exports.uploadAvatarByBase64 = (req, res, next) => {
    let form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
        let avatarBase64 = fields.uploadAvatar[0].replace(/^data:image\/\w+;base64,/, '');
        // let avatarBase64 = fields.uploadAvatar[0];
        let userID = fields.userID[0];
        let avatar = new Buffer(avatarBase64, 'base64');
        // TODO
        let fileName = userID + '-' + uuidv4() + '-' + file.filename;

        try {
            let uploadAvatarResult = await QiniuProxie.uploadAvatar(fileName, file.path);
            result.status = SUCCESS;
            result.data = { avatar: uploadAvatarResult.key };
        } catch (err) {
            result.message = err;
        }
    });
}

/** User Contact Part */

exports.requestAddContact = (req, res, next) => {
    let currentUser = req.data.user;
    let input = req.data.input;

    let userID = input.userID;
    let contactID = input.contactID;
    let message = input.reason || "";

    UserService.requestAddContact(currentUser, contactID, message, inviteResult => {
        req.data.output = inviteResult;
        next();
    })
}

exports.acceptAddContact = (req, res, next) => {
    let currentUser = req.data.user;
    let input = req.data.input;

    let userID = input.userID;
    let contactID = input.contactID;
    let remarkName = input.remarkName;

    UserService.acceptAddContact(currentUser, contactID, remarkName, contactList => {
        req.data.output = contactList;
        next();
    })
}

exports.rejectAddContact = (req, res, next) => {
    let currentUser = req.data.user;
    let input = req.data.input;

    let userID = input.userID;
    let rejectUserID = input.rejectUserID;
    let rejectReason = input.reason || "";

    UserService.rejectAddContact(currentUser, rejectUserID, rejectReason, contactList => {
        req.data.output = contactList;
        next();
    })
}

exports.deleteContact = (req, res, next) => {
    let currentUser = req.data.user;
    let input = req.data.input;

    let userID = input.userID;
    let contactID = input.contactID;
    UserService.deleteContact(currentUser, contactID, deleteResult => {
        req.data.output = deleteResult;
        next();
    })
}

exports.updateRemark = (req, res, next) => {
    let input = req.data.input;

    let userID = input.userID;
    let contactID = input.contactID;
    let remark = input.remark;

    UserService.updateRemark(userID, contactID, remark, updateResult => {
        req.data.output = updateResult;
        next();
    })
}

exports.getUserContacts = (req, res, next) => {
    let userID = req.data.input.userID;
    UserService.getUserContacts(userID, data => {
        req.data.output = data;
        next();
    })
}

exports.getBlackList = (req, res, next) => {
    let input = req.data.input;
    let userID = input.userID;
    UserService.getBlackList(userID, userList => {
        req.data.output = userList;
        next();
    })
}

exports.searchUserByTelephoneOrNickname = (req, res, next) => {
    let input = req.data.input;
    let queryCondition = input.queryCondition || "";
    let pageIndex = parseInt(input.pageIndex) || 0;
    UserService.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        req.data.output = searchResult;
        next();
    })
}

var saveFile = (filename, path, avatar) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path + filename, avatar, err => {
            if (err) {
                console.log('---[SAVE FILE ERROR]---')
                reject("Server error, save file fail")
            } else {
                resolve()
            }
        })
    })
}