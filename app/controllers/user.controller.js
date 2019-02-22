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
const {success, fail, error} = require('../commons/response.common');
const TError = require('../commons/error.common');;

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
        const {params, deviceID, extension} = req.input || {};
        const {telephone, password, verifyCode} = params;
        if (!telephone) {
            throw new TError(FAIL, `Parameters is incompleteness, please input your telephone`);
        }
        if (!password) {
            throw new TError(FAIL, `Parameters is incompleteness, please input your password`);
        }
        // TODO: to save the information about OS etc.
        // let extension = {};
        let result = {};
        try {
            if (_.isEmpty(verifyCode)) {
                result = await UserService.queryUserWithoutVerify(telephone, password, deviceID);
            } else {
                const validateResult = await SMSService.validateRecord(telephone, verifyCode, Constants.SMS_TYPE_LOGIN);
                if (validateResult) {
                    result = await UserService.updateDeviceID(telephone, password, deviceID);
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
        const {params, deviceID} = req.input;
        const {telephone, password, nickname, verifyCode} = params;
        const user = {
            telephone: telephone,
            password: password,
            nickname: nickname,
            deviceID: deviceID,
        };
        console.log('[--REGISTER--]: ', user);
        let result = {};
        try {
            const isExist = await UserService.isTelephoneExist(user.telephone);
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
            try {
                const {userID} = await UserService.tokenVerify(data.token);
                const uploadAvatarResult = await QiniuProxie.uploadAvatar(fileName, file.path);
                const avatarUrl = `${Constants.QN_DEFAULT_EXTERNAL_LINK}${uploadAvatarResult.key}`;
                const updateResult = await UserService.updateUserAvatar(userID, avatarUrl);
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
    };

    /** User Contact Part */
    async requestAddContact(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await UserService.requestAddContact(req.user, params.contactID, params.reason || "");
            result = success(null, "Send request success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async acceptAddContact(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await UserService.acceptAddContact(req.user, params.contactID, params.remarkName);
            result = success(null, "Contact request accepted");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async rejectAddContact(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await UserService.rejectAddContact(req.user, params.contactID, params.reason || "");
            result = success(null, "Rejected contact request success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async deleteContact(req, res, next) {
        const {params} = req.input;
        let result = null;
        try {
            await UserService.deleteContact(req.user, params.contactID);
            result = success(null, "Delete contact success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async updateRemark(req, res, next) {
        const {params} = req.input;
        const {userID} = req.user;
        let result = null;
        try {
            await UserService.updateRemark(userID, params.contactID, params.remark);
            result = success(null, "Update contact remark success");
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async getUserContacts(req, res, next) {
        const {userID} = req.user;
        let result = null;
        try {
            const contacts = await UserService.getUserContacts(userID);
            result = success(contacts);
        } catch (err) {
            result = error(err);
        }
        req.output = result;
        next();
    };

    async getBlackList(req, res, next) {
        const {userID} = req.user;
        req.data.output = await UserService.getBlackList(userID);
        next();
    };

    async searchUserByTelephoneOrNickname(req, res, next) {
        const {params} = req.input;
        const pageIndex = checkFieldIsExist(params.pageIndex) ? parseInt(params.pageIndex) : 0;
        try {
            const searchResult = await UserService.searchUserByTelephoneOrNickname(params.queryCondition || "", pageIndex);
            req.output = success(searchResult);
        } catch (err) {
            req.output = error(err);
        }
        next();
    };
}

const saveFile = (filename, path, avatar) => {
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
