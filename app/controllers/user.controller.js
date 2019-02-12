const _ = require('lodash');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const UserService = require('../services/user.service');
const SMSService = require('../services/sms.service');
const RSAUtil = require('../utils/RSAUtil');
const {SUCCESS, FAIL} = require("../utils/CodeConstants");
const Constants = require('../utils/Constants');

const multiparty = require('multiparty');
const atavarUpload = require('../api/commons/upload.server.common');
const QiniuProxie = require('../api/proxies/qiniu.server.proxies');
const TError = require('../commons/error.common');
const {success, fail, error} = require('../commons/response.common');

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
        const {params, extension} = req.input || {};
        const {user, verifyCode} = params;
        // TODO: to save the information about OS etc.
        // let extension = {};
        let result = {};
        try {
            if (_.isEmpty(verifyCode)) {
                result = await UserService.queryUserWithoutVerify(user.telephone, user.password);
            } else {
                const validateResult = await SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_LOGIN);
                if (validateResult) {
                    result = await UserService.updateDeviceID(user.telephone, user.password, user.deviceID);
                } else {
                    result = validateResult;
                }
            }
            req.output = success(result);
        } catch (err) {
            req.output = error(err);
        }
        next();
    };

    async register(req, res, next) {
        const {user, verifyCode} = req.input.params || {};
        const _user = {
            telephone: user.telephone,
            password: user.password,
            nickname: user.nickname,
            sex: user.sex || 0,
            birthday: user.birthday || '',
            location: user.location || '',
            signature: user.signature || '',
            countryCode: user.countryCode || '',
            deviceID: user.deviceID,
        };
        console.log('[--REGISTER--]: ', user);
        let result = {};
        try {
            const isExist = await UserService.isTelephoneExist(_user.telephone);
            if (!isExist) {
                await SMSService.validateRecord(user.telephone, verifyCode, Constants.SMS_TYPE_REGISTER);
                await UserService.createUser(user);
                result = success(null, "Congratulations, registration is successful");
            } else {
                result = fail(FAIL, "The telephone is already exist");
            }
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async tokenVerifyLogin(req, res, next) {
        let data = JSON.parse(req.body);
        // let data = req.body;
        let token = data.token;
        console.log('[--TOKEN AUTH--]', token);

        return await UserService.tokenVerifyLogin(token);
    }

    logout(req, res, next) {
        req.output = {
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
        const {params} = req.input;
        try {
            const userProfile = await UserService.getUserProfile(params.targetUserID);
            req.output = success(userProfile);
        } catch (err) {
            req.output = error(err);
        }
        next();
    };

    async updateUserProfile(req, res, next) {
        const {params} = req.input;
        const {userID} = req.user;
        const userProfile = {
            nickname: params.nickname || "",
            birthday: params.birthday || "",
            signature: params.signature || "",
            location: params.location || "",
            sex: checkFieldIsExist(params.sex) ? parseInt(params.sex) : 0,
        };
        try {
            await UserService.updateUserProfile(userID, userProfile);
            req.output = success(null, "Your profile is updated");
        } catch (err) {
            req.output = error(err);
        }
        next();
    };

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
};

const checkFieldIsExist = field => {
    return !(field === null || field === "" || field === undefined);
};

module.exports = new UserController();
