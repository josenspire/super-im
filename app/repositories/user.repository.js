const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const ContactModel = require('../models/contact.model');

const DateUtils = require('../utils/DateUtils');
const JWT_SECRET = require('../utils/Constants');   // secret key
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR, TOKEN_INVALID_OR_EXPIRED} = require("../utils/CodeConstants");

const TError = require('../commons/error.common');

const _ = require('lodash');
const jwt = require('jwt-simple');
const mongoose = require('mongoose');

class UserRepository {
    /**
     * Create user and initial concat list
     * @param {string} user
     * @param {string} token
     * @returns {Promise<{userProfile: any | {}, token: *}>}
     */
    async createUser(user, token) {
        const tokenID = mongoose.Types.ObjectId();
        user.token = tokenID;
        let _user = await insertUser(new UserModel(user));
        try {
            await new TokenModel({_id: tokenID, token, user: _user._id}).save();
            await new ContactModel({userID: _user._id, contacts: []}).save();
            return {userProfile: convertUser(_user), token};
        } catch (err) {
            console.log(err);
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    /**
     * Query user information by telephone and password
     * @param {string} telephone
     * @param {string} password
     * @returns {Promise<{user: Object, deviceID: string}>}
     */
    async queryUserByTelephoneAndPassword(telephone, password) {
        let result = {};
        const {user, isMatch} = await queryUserByTelephoneAndPassword(telephone, password);
        if (isMatch) {
            // await updateToken(user.token._id);
            result.token = user.token;  // tokenID
            result.userProfile = convertUser(user);
        } else {
            throw new TError(FAIL, 'Sorry, Your telephone or password is invalid');
        }
        return {user: result, deviceID: user.deviceID};
    };

    /**
     * Check is telephone already exist
     * @param telephone
     * @returns {Promise<boolean>}
     */
    async isTelephoneExist(telephone) {
        let result = false;
        try {
            const user = await UserModel.findOne({telephone: telephone}).lean();
            if (user) {
                result = true;
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, 'Sorry, server unknow error');
        }
        return result;
    };

    /**
     * Query user information by user id
     * @param {string} userID
     * @returns {Promise<userProfile>}
     */
    async queryByUserID(userID) {
        const user = await queryByUserID(userID);
        if (!user) {
            throw new TError(FAIL, `This user is not exist, Please check your operation`);
        } else {
            return convertUserProfile(user);
        }
    };

    /**
     * Update user profile by user id
     * @param {string} userID
     * @param {object} userProfile
     * @returns {Promise<void>}
     */
    async updateUserProfile(userID, userProfile) {
        const opts = {
            nickname: userProfile.nickname,
            birthday: userProfile.birthday,
            signature: userProfile.signature,
            location: userProfile.location,
            sex: userProfile.sex,
        };
        await UserModel.findOneAndUpdate({_id: userID}, {$set: opts})
            .exec()
            .catch(err => {
                throw new TError(FAIL, "Server error, fail to update user profile");
            });
        if (!user) {
            throw new TError(SERVER_UNKNOW_ERROR, "Sorry, this user is not exist")
        }
    };

    updateUserAvatar(userID, avatarUrl) {
        let result = {status: FAIL, data: {}, message: ''};
        return new Promise((resolve, reject) => {
            UserModel.update({_id: userID}, {$set: {avatar: avatarUrl}}, err => {
                if (err) {
                    result.message = err.message;
                    return reject(result);
                }
                result.status = SUCCESS;
                resolve(result);
            });
        });
    };

    /**
     * Query user group by telephone
     * @param telephoneList
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async queryUserListByTelephone(telephoneList) {
        let result = {status: FAIL, data: {}, message: ''};
        const promiseList = telephoneList.map(telephone => {
            return queryByTelephone(telephone);
        });
        try {
            let userList = await Promise.all(promiseList);
            let newUserList = [];
            userList.forEach(user => {
                if (user.status === SUCCESS) {
                    newUserList.push(user.data.user)
                }
            });
            result.status = SUCCESS;
            result.data.userList = newUserList;
        } catch (err) {
            console.log('--[QUERY USERLIST FAIL]--', err);
            result.message = err;
            result.data = {};
        }
        return result;
    };

    /**
     * Update device ID
     * @param telephone
     * @param password
     * @param deviceID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async updateDeviceID(telephone, password, deviceID) {
        let result = {};
        const {user, isMatch} = await queryUserByTelephoneAndPassword(telephone, password);
        if (isMatch) {
            result.token = user.token;
            result.userProfile = convertUser(await updateDeviceID(telephone, deviceID));
        } else {
            throw new TError(FAIL, 'Telephone or password is incorrect');
        }
        return result;
    };

    /**
     * Get user information by token
     * @param token
     * @returns {Promise<deviceID: string, userProfile: Object>}
     */
    async tokenVerify(token) {
        const user = await TokenModel.findOne({token})
            .populate('user')
            .exec()
            .catch(err => {
                console.log(err);
                throw new TError(SERVER_UNKNOW_ERROR, 'Sorry, server unknow error');
            });
        if (!user) {
            throw new TError(TOKEN_INVALID_OR_EXPIRED, 'This token is invalid, please login again');
        }
        return convertTokenInfo(user);
    };

    tokenExpire(token) {
        TokenModel.findOneAndRemove({token})
            .catch(err => {
                console.log(err);
                throw new TError(SERVER_UNKNOW_ERROR, 'Sorry, server unknow error');
            });
    };

    /**
     * Refresh user token information
     * @param {string | any} tokenID
     * @param {string | any} token
     * @param {string | any} userID
     * @returns {Promise<TokenProfile: Object>}
     */
    async refreshUserToken({tokenID, token, userID}) {
        let tokenProfile = await TokenModel.findById(tokenID);
        try {
            if (_.isEmpty(tokenProfile)) {
                await new TokenModel({_id: tokenID, token, user: userID}).save();
            } else {
                tokenProfile.token = token;
                tokenProfile.markModified("token");
                await tokenProfile.save();
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    /**
     * Reset user password by telephone and new password
     * @param telephone
     * @param newPassword
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async resetPassword(telephone, newPassword) {
        let result = {status: FAIL, data: {}, message: ''};
        const password = jwt.encode(newPassword, JWT_SECRET.JWT_PASSWORD_SECRET);
        try {
            const updateResult = await UserModel.findOneAndUpdate({telephone: telephone}, {$set: {password: password}});
            if (updateResult) {
                result.status = SUCCESS;
            } else {
                result.message = 'This telephone is no exist'
            }
        } catch (err) {
            result.status = SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        }
        return result;
    };

    /**
     * Accept add contact
     * @param {string} userID
     * @param {string} contactID
     * @param {string} remarkName
     * @returns {Promise<{userProfile: Object}>}
     */
    async acceptAddContact(userID, contactID, remarkName) {
        const isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            throw new TError(FAIL, 'You can\'t add yourself to a contact');
        } else {
            const user = await queryByUserID(contactID);
            if (!user) {
                throw new TError(FAIL, 'This user is not exist');
            } else {
                let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (isExist) {
                    throw new TError(FAIL, 'This user is already your contact');
                } else {
                    await acceptAddContact(userID, contactID, remarkName);
                    return convertUserProfile(user);
                }
            }
        }
    };

    /**
     * Delete contact
     * @param {string} userID
     * @param {string} contactID
     * @returns {Promise<void>}
     */
    async deleteContact(userID, contactID) {
        const isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            throw new TError(FAIL, 'You can\'t delete yourself as a contact');
        } else {
            const contactUser = await queryByUserID(contactID);
            if (!contactUser) {
                throw new TError(FAIL, 'This user is not exist');
            } else {
                let isContactExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (!isContactExist) {
                    throw new TError(FAIL, 'This user is not your contact');
                } else {
                    await deleteContact(userID, contactID);
                }
            }
        }
    };

    /**
     * Update user contact remark
     * @param userID
     * @param contactID
     * @param remark
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async updateRemark({userID, contactID, contactRemark, description, telephones, tags}) {
        const isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            throw new TError(FAIL, 'You can\'t set yourself a remark');
        }
        let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
        if (!isExist) {
            throw new TError(FAIL, 'This user is not your contact');
        }
        await updateRemark({userID, contactID, contactRemark, description, telephones, tags});
    };

    /**
     * Query user contacts by user id
     * @param userID
     * @returns {Promise<Array>}
     */
    async queryUserContactsByUserID(userID) {
        const contactsInfo = await queryUserContactsByUserID(userID);
        return _.isEmpty(contactsInfo) ? [] : convertContacts(contactsInfo);
    }

    /**
     * Search user information by telephone or nickname
     * @param {string} queryCondition
     * @param {Number} pageIndex
     * @returns {Promise<Object>}
     */
    async searchUserByTelephoneOrNickname(queryCondition, pageIndex) {
        const userList = await searchUserByTelephoneOrNickname(queryCondition, pageIndex);
        return convertSearchUserList(userList);
    }

    async checkContactIsExistByUserIDAndContactID(userID, contactID) {
        try {
            return await checkContactIsExistByUserIDAndContactID(userID, contactID);
        } catch (err) {
            return false;
        }
    };
}

const updateToken = _id => {
    const opts = {loginTime: DateUtils.formatCommonUTCDate(Date.now())};
    return TokenModel.findByIdAndUpdate(_id, {$set: opts})
        .exec()
        .catch(err => {
            console.log('--[UPDATE TOKEN ERROR]--', err.message);
            throw new Error('Server unknow error, login fail');
        });
};

const updateDeviceID = async (telephone, deviceID) => {
    let user = await UserModel.findOneAndUpdate({telephone}, {$set: {deviceID: deviceID}})
        .exec()
        .catch(err => {
            console.log(err);
            throw new Error('Server unknow error, login fail');
        });
    user['deviceID'] = deviceID;
    return user;
};

const insertUser = async userModel => {
    let message = '';
    let code = FAIL;
    try {
        return await userModel.save();
    } catch (err) {
        console.log("[--CREATE USER FAIL--]", err);
        let errMsg = err.errors;
        if (errMsg) {
            if (errMsg.telephone || errMsg.password) {
                message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
            } else if (errMsg.nickname) {
                message = errMsg.nickname.message;
            }
        } else {
            message = 'Sorry, server unknow error';
            code = SERVER_UNKNOW_ERROR;
        }
        throw new TError(code, message);
    }
};

const queryByTelephone = async telephone => {
    const user = await UserModel.findOne({telephone: telephone})
        .lean().catch(err => {
            console.log('---[QUERY BY TELEPHONE]---');
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        });
    return convertUser(user);
};

const queryByUserID = userID => {
    return UserModel.findOne({_id: userID}).lean()
        .catch(err => {
            console.log('---[QUERY BY USERID]---', err);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, query user fail');
        });
};

const queryUserByTelephoneAndPassword = async (telephone, password) => {
    let user = await UserModel.findOne({telephone})
        // .populate('token')
        .exec()
        .catch(err => {
            console.log(err);
            throw new TError(FAIL, 'The telephone or password is invalid');
        });
    if (!user) {
        throw new TError(FAIL, 'Sorry, Your telephone or password is invalid');
    } else {
        const isMatch = user.comparePassword(password);
        return (isMatch ? {user, isMatch: true} : {isMatch: false})
    }
};

/** User Contact Part */
const acceptAddContact = async (userID, contactID, remarkName) => {
    let contact = {
        userID: contactID,     // current user add other contact
        remark: {
            remarkName: remarkName
        },
    };
    let _contact = {
        userID: userID,        // other contact add current user
        remark: {
            remarkName: ''
        },
    };
    return await Promise.all([addContactToEachOther(userID, contact), addContactToEachOther(contactID, _contact)])
};

const addContactToEachOther = async (userID, contact) => {
    const updateResult = await ContactModel.findOneAndUpdate({userID}, {$addToSet: {contacts: contact}}).lean()
        .catch(err => {
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
        });
    if (_.isEmpty(updateResult)) {
        // should handle this issue to init contact list
        throw new TError(FAIL, 'Current user is not exist, add contact fail');
    }
    return updateResult;
};

const deleteContact = (userID, contactID) => {
    return Promise.all([deleteContactToEachOther(userID, contactID), deleteContactToEachOther(contactID, userID)])
        .catch(err => {
            console.log(err);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, delete contact fail');
        });
};

const deleteContactToEachOther = (userID, contactID) => {
    return new Promise((resolve, reject) => {
        ContactModel.update({userID: userID}, {$pull: {contacts: {userID: contactID}}}, (err, result) => {
            if (err) {
                reject('Server unknow error, delete contact fail');
            } else {
                resolve(result);
            }
        })
    })
};

const checkContactIsExistByUserIDAndContactID = async (userID, contactID) => {
    let isExist = false;
    let userContacts = await queryUserContactsByUserID(userID);
    if (!userContacts) {
        isExist = false;
    } else {
        let contacts = userContacts.contacts;
        for (let index = 0; index < contacts.length; index++) {
            let contact = contacts[index];
            if (_.toString(contact.userID._id) === contactID) {
                isExist = true;
                break;
            }
        }
    }
    return isExist;
};

const checkContactIDIsCurrentUserID = (userID, contactID) => {
    let _userID = JSON.parse(JSON.stringify(userID));
    if (_userID) {
        if (_.toString(_userID) === contactID) return true;
    }
    return false;
};

const updateRemark = async ({userID, contactID, contactRemark, description, telephones, tags}) => {
    let contactList = await ContactModel.findOne({userID})
        .catch(err => {
            throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
        });
    if (!_.isEmpty(contactList)) {
        let contacts = contactList.contacts;
        let targetContact = _.find(contacts, contact => _.toString(contact.userID) === contactID);
        targetContact.remark = {
            remarkName: contactRemark,
            telephones,
            description,
            tags,
        };
        contactList.markModified('remark');
        try {
            await contactList.save();
        } catch (err) {
            // TODO: need rollback
            console.log(err.message);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, update remark name fail');
        }
    }
};

const queryUserContactsByUserID = userID => {
    return ContactModel.findOne({userID: userID})
        .populate("contacts.userID")    // 查询数组中的某个字段的ref数据
        .lean()
        .exec()
        .catch(err => {
            console.log(err);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, get user contact list fail');
        });
};

const searchUserByTelephoneOrNickname = async (queryCondition, pageIndex) => {
    // const nickNameReg = new RegExp(queryCondition, 'i');
    // UserModel.find({ $or: [{ telephone: queryCondition }, { nickname: { $regex: nickNameReg } }] })
    const userList = await UserModel.find({$or: [{telephone: queryCondition}, {nickname: queryCondition}]})
        .populate("user")
        .limit(20)
        .skip(pageIndex * 20)
        .exec()
        .catch(err => {
            console.log('---[SEARCH USER FAIL]---', err);
            throw new TError(SERVER_UNKNOW_ERROR, 'Server unknow error, search user fail');
        });
    return userList;
};

const convertUser = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.deviceID;
    return _user;
};

const convertUserProfile = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.deviceID;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    return _user;
};

const convertContactInfo = contact => {
    const _contact = JSON.parse(JSON.stringify(contact)) || {};
    let user = _contact.userID;
    user.userID = user._id;

    delete user._id;
    delete user.password;
    delete user.deviceID;
    delete user.token;
    delete user.meta;
    delete user.status;
    delete user.role;

    // let _user = {};
    // _user.userProfile = user;
    // _user.remark = _contact.remark;
    // return _user;
    return _.merge({}, {userProfile: user}, _contact.remark);
};

const convertContacts = contactsData => {
    let _contactList = contactsData.contacts;
    if (!_contactList.length) return [];

    let convertContactsData = [];
    for (let i = 0; i < _contactList.length; i++) {
        let contact = _contactList[i];
        contact = convertContactInfo(contact);
        convertContactsData.push(contact);
    }
    return convertContactsData;
};

const convertSearchUserList = userList => {
    let _userList = JSON.parse(JSON.stringify(userList));
    if (!_userList.length) return [];

    let convertUserListData = [];
    for (let i = 0; i < _userList.length; i++) {
        let user = _userList[i];
        user = convertUserProfile(user);
        convertUserListData.push(user);
    }
    return convertUserListData;
};

const convertTokenInfo = tokenInfo => {
    let _tokenInfo = JSON.parse(JSON.stringify(tokenInfo));

    let userProfile = _tokenInfo.user;
    let deviceID = userProfile.deviceID;
    userProfile.userID = userProfile._id;

    delete userProfile._id;
    delete userProfile.meta;
    delete userProfile.deviceID;
    delete userProfile.password;
    delete userProfile.token;

    return {userProfile, deviceID};
};

module.exports = new UserRepository();