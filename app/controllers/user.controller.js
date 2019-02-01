const _ = require('lodash');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const UserService = require('../services/user.service');
const GroupService = require('../services/group.service');
const SMSService = require('../services/sms.service');
const RSAUtil = require('../utils/RSAUtil');
const {SUCCESS, FAIL} = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

const multiparty = require('multiparty');
const atavarUpload = require('../api/commons/upload.server.common');
const QiniuProxie = require('../api/proxies/qiniu.server.proxies');

class UserController {

    getPublicKey(req, res, next) {
        return res.json({
            status: SUCCESS,
            data: {
                secretKey: RSAUtil.getPublicKey()
            },
            message: ''
        })
    };

    async login(req, res, next) {
        const data = req.data.input.params || {};

        const verifyCode = data.verifyCode || "";
        let user = {};
        user.telephone = data.telephone;
        user.password = data.password;
        user.deviceID = data.deviceID;

        if (_.isEmpty(verifyCode)) {
            req.data.output = await UserService.queryUserWithoutVerify(user.telephone, user.password);
            next();
        } else {
            const validateCallback = await SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN);
            if (validateCallback.status === SUCCESS) {
                req.data.output = await UserService.updateDeviceID(user.telephone, user.password, user.deviceID);
                next();
            } else {
                req.data.output = validateCallback;
                next();
            }
        }
    };

    async register(req, res, next) {
        let data = req.data.input.params || {};

        let user = {};
        user.telephone = data.telephone;
        user.password = data.password;
        user.nickname = data.nickname;
        user.sex = data.sex || 0;
        user.birthday = data.birthday || '';
        user.location = data.location || '';
        user.signature = data.signature || '';
        user.countryCode = data.countryCode || '';
        user.deviceID = data.deviceID;

        const verifyCode = data.verifyCode || '';

        console.log('[--REGISTER--]: ', data)
        const isExist = await UserService.isTelephoneExist(user.telephone);
        if (isExist.status === false) {
            const _sms = await SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER);
            if (_sms.status === SUCCESS) {
                req.data.output = UserService.createUser(user);
            } else {
                req.data.output = _sms;
            }
            next();
        } else {
            let result = {data: {}};
            result.status = FAIL;
            result.message = isExist.message;
            req.data.output = result;
            next();
        }
    };

    async tokenVerifyLogin(req, res, next) {
        let data = JSON.parse(req.body);
        // let data = req.body;
        let token = data.token;
        console.log('[--TOKEN AUTH--]', token);

        return await UserService.tokenVerifyLogin(token);
    }

    logout(req, res, next) {
        req.data.output = {
            status: SUCCESS,
            data: {},
            message: ""
        };
        next();
    }

    /** User profile */
    async resetPassword(req, res, next) {
        let data = req.data.input.params || {};

        const telephone = data.telephone;

        const result = await UserService.resetPassword(telephone);
        return res.json(result);
    }

    async getUserProfile(req, res, next) {
        const input = req.data.input;
        const userID = input.targetUserID;
        req.data.output = await UserService.getUserProfile(userID);
        next();
    }

    async updateUserProfile(req, res, next) {
        const input = req.data.input;
        const userID = input.userID;
        const userProfile = {
            nickname: input.nickname || "",
            birthday: input.birthday || "",
            signature: input.signature || "",
            location: input.location || "",
            sex: parseInt(input.sex) || 0,
        };
        req.data.output = await UserService.updateUserProfile(userID, userProfile);
        next();
    }

    /** User avatar upload */
    uploadAvatar(req, res, next) {
        let result = {status: FAIL, data: {}, message: ""};
        atavarUpload.single('uploadAvatar')(req, res, async err => {
            if (err) {
                console.error("---[Upload avatar error]---", err)
                result.message = err.message;
                return res.json(result);
            } else if (!req.file) {
                result.message = "Parameters is incompleteness";
                return res.json(result);
            }
            let file = req.file;
            let data = JSON.parse(req.body.params);
            let fileName = file.filename;
            if (_.isEmpty(data) || _.isEmpty(data.token)) {
                result.message = "Parameters is incompleteness";
                return res.json(result);
            }
            const tokenValid = await UserService.tokenVerify(data.token);
            if (tokenValid.status != SUCCESS) {
                return res.json(tokenValid);
            }
            const userProfile = tokenValid.data.userProfile;
            try {
                const uploadAvatarResult = await QiniuProxie.uploadAvatar(fileName, file.path);
                const avatarUrl = `${Constants.QN_DEFAULT_EXTERNAL_LINK}${uploadAvatarResult.key}`;
                const updateResult = await UserService.updateUserAvatar(userProfile.userID, avatarUrl);
                result.status = updateResult.status;
                result.data = {
                    avatarUrl,
                    width: "200",
                    height: "200"
                };
            } catch (err) {
                result.message = err.message;
            }
            return res.json(result);
        });
    }

    uploadAvatars(req, res, next) {
        let result = {status: FAIL, data: {}, message: ""};
        atavarUpload.array('uploadAvatar', 2)(req, res, async err => {
            if (err) {
                console.error("---[Upload avatar error]---", err)
                result.message = err.message;
            } else if (req.files.length) {
                let files = req.files;
                let data = req.body;
                console.log("===[REQUEST DATA]===", files)

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
                    result.message = err.message;
                }
            } else {
                result.message = "Parameters is incompleteness";
            }
            return res.json(result);
        })
    }

    uploadAvatarByBase64(req, res, next) {
        let form = new multiparty.Form();
        form.parse(req, async (err, fields, files) => {
            const avatarBase64 = fields.uploadAvatar[0].replace(/^data:image\/\w+;base64,/, '');
            // let avatarBase64 = fields.uploadAvatar[0];
            let userID = fields.userID[0];
            let avatar = new Buffer(avatarBase64, 'base64');
            // TODO
            let fileName = userID + '-' + uuidv4() + '-' + file.filename;

            try {
                let uploadAvatarResult = await QiniuProxie.uploadAvatar(fileName, file.path);
                result.status = SUCCESS;
                result.data = {avatar: uploadAvatarResult.key};
            } catch (err) {
                result.message = err;
            }
        });
    }

    /** User Contact Part */
    async requestAddContact(req, res, next) {
        const currentUser = req.data.user;
        const input = req.data.input;

        const contactID = input.contactID;
        const message = input.reason || "";
        req.data.output = await UserService.requestAddContact(currentUser, contactID, message);
        next();
    }

    async acceptAddContact(req, res, next) {
        let currentUser = req.data.user;
        let input = req.data.input;

        let userID = input.userID;
        let contactID = input.contactID;
        let remarkName = input.remarkName;

        req.data.output = await UserService.acceptAddContact(currentUser, contactID, remarkName);
        next();
    }

    async rejectAddContact(req, res, next) {
        const currentUser = req.data.user;
        const input = req.data.input;

        const contactID = input.contactID;
        const rejectReason = input.reason || "";

        req.data.output = await UserService.rejectAddContact(currentUser, contactID, rejectReason);
        next();
    }

    async deleteContact(req, res, next) {
        const currentUser = req.data.user;
        const input = req.data.input;

        const contactID = input.contactID;
        req.data.output = await UserService.deleteContact(currentUser, contactID);
        next();
    }

    async updateRemark(req, res, next) {
        let input = req.data.input;

        let userID = input.userID;
        let contactID = input.contactID;
        let remark = input.remark;

        req.data.output = await UserService.updateRemark(userID, contactID, remark);
        next();
    }

    async getUserContacts(req, res, next) {
        let userID = req.data.input.userID;
        const data = await UserService.getUserContacts(userID);
        req.data.output = data;
        next();
    }

    async getBlackList(req, res, next) {
        let input = req.data.input;
        let userID = input.userID;
        req.data.output = await UserService.getBlackList(userID);    
        next();
    }

    async searchUserByTelephoneOrNickname(req, res, next) {
        const input = req.data.input;
        const queryCondition = input.queryCondition || "";
        const pageIndex = parseInt(input.pageIndex) || 0;
        const searchResult = await UserService.searchUserByTelephoneOrNickname(queryCondition, pageIndex);
        req.data.output = searchResult;
        next();
    }

};

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

module.exports = new UserController();
