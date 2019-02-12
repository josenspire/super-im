const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const ContactModel = require('../models/contact.model');

const DateUtils = require('../utils/DateUtils');
const JWT_SECRET = require('../utils/Constants');   // secret key
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} = require("../utils/CodeConstants");

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
     * @param telephone
     * @param password
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async queryUserByTelephoneAndPassword(telephone, password) {
        let result = {};
        const {user, isMatch} = await queryUserByTelephoneAndPassword(telephone, password);
        if (isMatch) {
            await updateToken(user.token._id);
            const _user = convertUser(user);
            result.token = user.token.token;
            result.userProfile = _user;
        } else {
            throw new TError(FAIL, 'Sorry, Your telephone or password is invalid');
        }
        return result;
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
            const {token} = user.token;
            let _user = await updateDeviceID(telephone, deviceID);
            result.userProfile = convertUser(_user);
            result.token = token;
        } else {
            throw new TError(FAIL, 'Telephone or password is incorrect');
        }
        return result;
    };

    /**
     * Get user information by token
     * @param token
     * @returns {Promise<token: string, userProfile: Object>}
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
            throw new TError(FAIL, 'This token is invalid, please login again');
        }
        return convertTokenInfo(user);
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
        }
        catch (err) {
            result.status = SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        }
        return result;
    };

    /**
     * Accept add contact
     * @param userID
     * @param contactID
     * @param remarkName
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async acceptAddContact(userID, contactID, remarkName) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            const isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
            if (isCurrentUser) {
                result.message = 'You can\'t add yourself to a contact';
            }
            else {
                let user = await queryByUserID(contactID);
                if (!user) {
                    result.message = 'This user is not exist';
                }
                else {
                    let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                    if (isExist) {
                        result.message = 'This user is already your contact';
                    }
                    else {
                        await acceptAddContact(userID, contactID, remarkName);
                        result.data.user = convertUserProfile(user);
                        result.status = SUCCESS;
                    }
                }
            }
        } catch (err) {
            console.log('---[ADD CONTACT FAIL]---', err);
            result.message = err;
            result.data = {};
        }
        return result;
    };

    /**
     * Delete contact
     * @param userID
     * @param contactID
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async deleteContact(userID, contactID) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            let isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
            if (isCurrentUser) {
                result.message = 'You can\'t delete yourself as a contact';
            }
            else {
                let contactUser = await queryByUserID(contactID);
                if (!contactUser) {
                    result.message = 'This user is not exist';
                }
                else {
                    let isContactExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                    if (!isContactExist) {
                        result.message = 'This user is not your contact';
                    }
                    else {
                        await deleteContact(userID, contactID);
                        result.status = SUCCESS;
                        result.data.contactUser = convertUserProfile(contactUser);
                    }
                }
            }
        } catch (err) {
            console.log('---[DELETE CONTACT FAIL]---', err);
            result.message = err;
            result.data = {};
        }
        return result;
    };

    /**
     * Update user contact remark
     * @param userID
     * @param contactID
     * @param remark
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async updateRemark(userID, contactID, remark) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            let isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
            if (isCurrentUser) {
                result.message = 'You can\'t set yourself a remark'
            }
            else {
                let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (!isExist) {
                    result.message = 'This user is not your contact';
                }
                else {
                    await updateRemark(userID, contactID, remark);
                    result.status = SUCCESS;
                }
            }
        } catch (err) {
            console.log('---[UPDATE CONTACT REMARK FAIL]---', err);
            result.message = err;
            result.data = {};
        }
        return result;
    };

    /**
     * Query user contacts by user id
     * @param userID
     * @returns {Promise<Array>}
     */
    async queryUserContactsByUserID(userID) {
        try {
            let contactsInfo = await queryUserContactsByUserID(userID);
            return _.isEmpty(contactsInfo) ? [] : convertContacts(contactsInfo);
        } catch (err) {
            console.log('---[QUERY CONTACTS FAIL]---', err);
            throw new TError(FAIL, err.message);
        }
    }

    /**
     * Search user information by telephone or nickname
     * @param queryCondition
     * @param pageIndex
     * @returns {Promise<{status: number, data: {}, message: string}>}
     */
    async searchUserByTelephoneOrNickname(queryCondition, pageIndex) {
        let result = {status: FAIL, data: {}, message: ''};
        try {
            let userList = await searchUserByTelephoneOrNickname(queryCondition, pageIndex);
            result.data.userList = convertSearchUserList(userList);
            result.status = SUCCESS;
        } catch (err) {
            console.log('---[QUERY USER FAIL]---', err);
            result.message = err;
            result.data = {};
        }
        return result;
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
            throw new Error(err.message);
        });
    return convertUser(user);
};

const queryByUserID = userID => {
    return UserModel.findOne({_id: userID}).lean()
        .catch(err => {
            console.log('---[QUERY BY USERID]---', err);
            throw new Error('Server unknow error, query user fail');
        });
};

const queryUserByTelephoneAndPassword = async (telephone, password) => {
    const user = await UserModel.findOne({telephone})
        .populate('token')
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
const acceptAddContact = (userID, contactID, remarkName) => {
    return new Promise((resolve, reject) => {
        try {
            let contact = {
                userID: contactID,     // current user add other contact
                remarkName: remarkName
            };
            let _contact = {
                userID: userID,        // other contact add current user
                remarkName: ''
            };
            Promise.all([addContactToEachOther(userID, contact), addContactToEachOther(contactID, _contact)])
                .then(result => {
                    resolve(result)
                })
                .catch(err => {
                    reject('Server unknow error, add contact fail')
                })
        } catch (err) {
            console.log(err);
            reject('Server unknow error, add contact fail')
        }
    });
};

const addContactToEachOther = (userID, contact) => {
    return new Promise((resolve, reject) => {
        ContactModel.findOneAndUpdate({userID: userID}, {$addToSet: {contacts: contact}}, (err, result) => {
            if (err) {
                reject('Server unknow error, add contact fail');
            } else if (result) {
                resolve(result);
            } else {
                reject('Current user is not exist, add contact fail');
            }
        })
    })
};

const deleteContact = (userID, contactID) => {
    return new Promise(async (resolve, reject) => {
        Promise.all([deleteContactToEachOther(userID, contactID), deleteContactToEachOther(contactID, userID)])
            .then(result => {
                resolve(result)
            })
            .catch(err => {
                reject('Server unknow error, delete contact fail')
            })
    })
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
    try {
        let userContacts = await queryUserContactsByUserID(userID);
        if (!userContacts) {
            isExist = false;
        } else {
            let contacts = userContacts.contacts;
            for (let index = 0; index < contacts.length; index++) {
                let contact = contacts[index];
                if (contact.userID._id.toString() === contactID) {
                    isExist = true;
                    break;
                }
            }
        }
    } catch (err) {
        console.log(err);
        isExist = false;
    }
    return isExist;
};

const checkContactIDIsCurrentUserID = (userID, contactID) => {
    let _userID = JSON.parse(JSON.stringify(userID));
    if (_userID) {
        if (_userID.toString() === contactID) return true;
    }
    return false;
};

const updateRemark = (userID, contactID, remark) => {
    return new Promise(async (resolve, reject) => {
        ContactModel.findOne({userID: userID}, (err, contactList) => {
            if (err) {
                reject(err.message);
            } else if (contactList) {
                let contacts = contactList.contacts;
                for (let i = 0; i < contacts.length; i++) {
                    if (contacts[i].userID == contactID) {
                        contacts[i].remark = remark;
                        contactList.markModified('remark');
                        contactList.save((err, newContactProfile) => {
                            if (err) reject('Server unknow error, update remark name fail');
                            else resolve(newContactProfile);
                        });
                    }
                }
            }
        })
    })
};

const queryUserContactsByUserID = userID => {
    return ContactModel.findOne({userID: userID})
        .populate("contacts.userID")    // 查询数组中的某个字段的ref数据
        .exec()
        .catch(err => {
            console.log(err);
            throw new Error('Server unknow error, get user contact list fail');
        });
};

const searchUserByTelephoneOrNickname = (queryCondition, pageIndex) => {
    return new Promise((resolve, reject) => {
        // const nickNameReg = new RegExp(queryCondition, 'i');
        // UserModel.find({ $or: [{ telephone: queryCondition }, { nickname: { $regex: nickNameReg } }] })
        UserModel.find({$or: [{telephone: queryCondition}, {nickname: queryCondition}]})
            .populate("user")
            .limit(20)
            .skip(pageIndex * 20)
            .exec((err, userList) => {
                if (err) {
                    console.log('---[SEARCH USER FAIL]---', err)
                    reject('Server unknow error, search user fail')
                } else if (!userList) {
                    reject('User is not exist')
                } else {
                    resolve(userList)
                }
            })
    })
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

    let _user = {};
    _user.userProfile = user;
    _user.remark = _contact.remark;
    return _user;
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
    userProfile.userID = userProfile._id;

    delete userProfile._id;
    delete userProfile.meta;
    delete userProfile.deviceID;
    delete userProfile.password;
    delete userProfile.token;

    return userProfile;
};

module.exports = new UserRepository();