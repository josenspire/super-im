const UserModel = require('../models/user.server.model')
const TokenModel = require('../models/token.server.model')
const ContactModel = require('../models/contact.server.model')

const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')
const StringUtil = require('../utils/StringUtil')
const JWT_SECRET = require('../utils/Constants')   // secret key

const jwt = require('jwt-simple')
const _ = require('lodash')
let mongoose = require('mongoose')

exports.createUser = async (user, token, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    let tokenID = mongoose.Types.ObjectId();
    try {
        user.token = tokenID;
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);

        let tokenModel = new TokenModel({ _id: tokenID, token: token, user: user._id });
        let _token = await insertToken(tokenModel);

        await initContactList(user._id);

        result.status = CodeConstants.SUCCESS;
        result.data.user = convertUser(_user);
        result.data.token = _token.token;
        result.data.secretKey = Constants.AES_SECRET;
    } catch (err) {
        console.log(err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.queryUserByTelephoneAndPassword = async (telephone, password, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let _user = convertUser(data.user);
            await updateToken(data.user.token);
            result.data.token = data.user.token.token;
            result.data.user = _user;
            result.data.secretKey = Constants.AES_SECRET;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.message = 'Sorry, Your telephone or password is invalid';
        }
    } catch (err) {
        console.log(err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

// check telephone is exist?
exports.isTelephoneExist = (telephone, cb) => {
    let result = { status: false, message: '' };
    UserModel.findOne({ telephone: telephone }, (err, user) => {
        if (err) {
            result.message = 'Sorry, server unknow error';
        } else if (user) {
            result.status = true;
            result.message = 'The telephone is already exist';
        } else {
            result.status = false;
            result.message = 'The telephone is not exist'
        }
        cb(result)
    })
}

exports.isUserExist = async userID => {
    try {
        let user = await queryByUserID(userID);
        if (!user) return false;
        return true;
    } catch (err) {
        console.log('---[CHECK USER EXIST ERROR]---', err);
    }
}

exports.queryByUserID = async (userID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let user = await queryByUserID(userID);
        if (!user) {
            result.message = 'This user is not exist'
        } else {
            result.data.userProfile = convertUserProfile(user);
            result.status = CodeConstants.SUCCESS;
        }
    } catch (err) {
        console.log('--[QUERY BY USERID FAIL]--')
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.queryUserListByTelephone = async (telephoneList, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    let promiseList = telephoneList.map(telephone => {
        return queryByTelephone(telephone);
    })
    try {
        let userList = await Promise.all(promiseList);
        let newUserList = [];
        userList.forEach(user => {
            if (user.status === CodeConstants.SUCCESS) {
                newUserList.push(user.data.user)
            }
        })
        result.status = CodeConstants.SUCCESS;
        result.data.userList = newUserList;
    } catch (err) {
        console.log('--[QUERY USERLIST FAIL]--', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

// update deviceID 
exports.updateDeviceID = async (telephone, password, deviceID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let token = data.user.token.token;
            let _user = await updateDeviceID(telephone, deviceID);
            delete _user.deviceID;
            result.data.user = convertUser(_user);
            result.data.secretKey = Constants.AES_SECRET;
            result.data.token = token;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.message = 'Telephone or password is incorrect';
        }
    } catch (err) {
        console.log('--[UPDATE DEVICEID FAIL]--', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.isTokenValid = (token, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    TokenModel.findOne({ token: token })
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (!token) {
                result.message = 'This token is invalid, please login again';
            } else if (token) {
                result.status = CodeConstants.SUCCESS;
                result.data.userID = token.user;
            }
            cb(result)
        })
}

exports.resetPassword = (telephone, newPassword, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    let password = jwt.encode(newPassword, JWT_SECRET.JWT_PASSWORD_SECRET);
    UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { password: password } })
        .exec((err, user) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (user) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.message = 'This telephone is no exist'
            }
            cb(result)
        })
}


/** User Contact Part */
exports.acceptAddContact = async (userID, contactID, remarkName, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            result.message = 'You can\'t add yourself to a contact';
        } else {
            let isUserExist = await queryByUserID(contactID);
            if (!isUserExist) {
                result.message = 'This user is not exist';
            } else {
                let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (isExist) {
                    result.message = 'This user is already your contact';
                } else {
                    await acceptAddContact(userID, contactID, remarkName);
                    result.status = CodeConstants.SUCCESS;
                }
            }
        }
    } catch (err) {
        console.log('---[ADD CONTACT FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.deleteContact = async (userID, contactID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            result.message = 'You can\'t delete yourself as a contact';
        } else {
            let isUserExist = await queryByUserID(contactID);
            if (!isUserExist) {
                result.message = 'This user is not exist';
            } else {
                let isContactExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (!isContactExist) {
                    result.message = 'This user is not your contact';
                } else {
                    let deleteResult = await deleteContact(userID, contactID);
                    result.status = CodeConstants.SUCCESS;
                }
            }
        }
    } catch (err) {
        console.log('---[DELETE CONTACT FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.updateRemarkName = async (userID, contactID, remarkName, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkContactIDIsCurrentUserID(userID, contactID);
        if (isCurrentUser) {
            result.message = 'You can\'t set yourself a remark name'
        } else {
            let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
            if (!isExist) {
                result.message = 'This user is not your contact';
            } else {
                let updateResult = await updateRemarkName(userID, contactID, remarkName);
                result.status = CodeConstants.SUCCESS;
            }
        }
    } catch (err) {
        console.log('---[UPDATE CONTACT REMARK FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result);
}

exports.queryUserContactsByUserID = async (userID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let contactsInfo = await queryUserContactsByUserID(userID);
        if (!contactsInfo) {
            result.data.contacts = [];
        } else {
            result.data.contacts = convertContacts(contactsInfo);
            result.status = CodeConstants.SUCCESS;
        }
    } catch (err) {
        console.log('---[QUERY CONTACTS FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.searchUserByTelephoneOrNickname = async (queryCondition, pageIndex, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let userList = await searchUserByTelephoneOrNickname(queryCondition, pageIndex);
        result.data.userList = convertSearchUserList(userList);
        result.status = CodeConstants.SUCCESS;
    } catch (err) {
        console.log('---[QUERY USER FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result);
}

exports.checkContactIsExistByUserIDAndContactID = async (userID, contactID) => {
    try {
        let isExist = await checkContactIsExistByUserIDAndContactID(userID, contactID);
        return isExist;
    } catch (err) {
        return false;
    }
}

/** User & Token Part */

var insertToken = tokenModel => {
    return new Promise((resolve, reject) => {
        tokenModel.save((err, data) => {
            if (err) {
                console.log('--[CREATE TOKEN FAIL]--', err)
                reject('Server unknow error,login fail')
            } else {
                resolve(data);
            }
        })
    })
}

var updateToken = (_id) => {
    return new Promise((resolve, reject) => {
        let opts = { loginTime: DateUtils.formatCommonUTCDate(Date.now()) };
        TokenModel.findByIdAndUpdate(_id, { $set: opts })
            .exec(err => {
                if (err) {
                    console.log('--[UPDATE TOKEN ERROR]--', err.message);
                    reject('Server unknow error, login fail')
                } else {
                    resolve()
                }
            })
    })
}

var updateDeviceID = (telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { deviceID: deviceID } }, (err, user) => {
            if (err) {
                console.log(err)
                reject('Server unknow error, login fail')
            } else {
                user.deviceID = deviceID;
            }
            resolve(user);
        })
    })
}

var insertUser = userModel => {
    let message = '';
    return new Promise((resolve, reject) => {
        userModel.save((err, user) => {
            if (err) {
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
                }
                reject(message);
            } else {
                resolve(user);
            }
        });
    })
}

var queryByTelephone = telephone => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .exec((err, user) => {
                if (err) {
                    console.log('---[QUERY BY TELEPHONE]---')
                    reject('Server unknow error')
                } else if (user) {
                    resolve(convertUser(user));
                }
            })
    })
}

var queryByUserID = userID => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ _id: userID })
            .exec((err, user) => {
                if (err) {
                    console.log('---[QUERY BY USERID]---');
                    reject('Server unknow error, query user fail');
                } else {
                    resolve(user);
                }
            })
    })
}

var queryUserByTelephoneAndPassword = (telephone, password) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .populate('token')
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    reject('The telephone or password is invalid')
                } else if (!user) {
                    resolve('Sorry, Your telephone or password is invalid');
                } else {
                    user.comparePassword(password, isMatch => {
                        resolve(isMatch ? { user: user, isMatch: true } : { isMatch: false })
                    })
                }
            })
    })
}

/** User Contact Part */
var acceptAddContact = (userID, contactID, remarkName) => {
    return new Promise((resolve, reject) => {
        try {
            let contact = {
                userID: contactID,     // current user add other contact
                remarkName: remarkName
            };
            let _contact = {
                userID: userID,        // other contact add current user
                remarkName: ''
            }
            Promise.all([addContactToEachOther(userID, contact), addContactToEachOther(contactID, _contact)])
                .then(result => { resolve(result) })
                .catch(err => { reject('Server unknow error, add contact fail') })
        } catch (err) {
            console.log(err)
            reject('Server unknow error, add contact fail')
        }
    })
}

var addContactToEachOther = (userID, contact) => {
    return new Promise((resolve, reject) => {
        ContactModel.findOneAndUpdate({ userID: userID }, { $addToSet: { contacts: contact } }, (err, result) => {
            if (err) {
                reject('Server unknow error, add contact fail');
            } else if (result) {
                resolve(result);
            } else {
                reject('Current user is not exist, add contact fail');
            }
        })
    })
}

var deleteContact = (userID, contactID) => {
    return new Promise(async (resolve, reject) => {
        Promise.all([deleteContactToEachOther(userID, contactID), deleteContactToEachOther(contactID, userID)])
            .then(result => { resolve(result) })
            .catch(err => { reject('Server unknow error, delete contact fail') })
    })
}

var deleteContactToEachOther = (userID, contactID) => {
    return new Promise((resolve, reject) => {
        ContactModel.update({ userID: userID }, { $pull: { contacts: { userID: contactID } } }, (err, result) => {
            if (err) {
                reject('Server unknow error, delete contact fail');
            } else {
                resolve(result);
            }
        })
    })
}

var initContactList = userID => {
    return new Promise((resolve, reject) => {
        let contactModel = new ContactModel({ userID: userID, contacts: [] });
        contactModel.save((err, contactList) => {
            if (err) {
                console.log('INIT CONTACT LIST FAIL', err)
                reject('Server unknow error, init contact list fail')
            } else {
                resolve(contactList);
            }
        })
    })
}

var checkContactIsExistByUserIDAndContactID = async (userID, contactID) => {
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
        console.log(err)
        isExist = false;
    }
    return isExist;
}

var checkContactIDIsCurrentUserID = (userID, contactID) => {
    let _userID = JSON.parse(JSON.stringify(userID));
    if (_userID) {
        if (_userID.toString() === contactID) return true;
    }
    return false;
}

var updateRemarkName = (userID, contactID, remarkName) => {
    return new Promise(async (resolve, reject) => {
        ContactModel.findOne({ userID: userID }, (err, contactList) => {
            if (err) {
                reject(err)
            } else if (contactList) {
                let contacts = contactList.contacts;
                for (let i = 0; i < contacts.length; i++) {
                    if (contacts[i].userID == contactID) {
                        contacts[i].remarkName = remarkName;
                        contactList.markModified('remarkName');
                        contactList.save((err, newContactProfile) => {
                            if (err) reject('Server unknow error, update remark name fail');
                            else resolve(newContactProfile);
                        });
                    }
                }
            }
        })
    })
}

var queryUserContactsByUserID = userID => {
    return new Promise((resolve, reject) => {
        ContactModel.findOne({ userID: userID })
            .populate("contacts.userID")    // 查询数组中的某个字段的ref数据
            .exec((err, contacts) => {
                if (err) {
                    console.log(err);
                    reject('Server unknow error, get user contact list fail');
                } else {
                    resolve(contacts);
                }
            })
    })
}

var searchUserByTelephoneOrNickname = (queryCondition, pageIndex) => {
    return new Promise((resolve, reject) => {
        const nickNameReg = new RegExp(queryCondition, 'i');
        UserModel.find({ $or: [{ telephone: queryCondition }, { nickname: { $regex: nickNameReg } }] })
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
}

var convertUser = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.__v;
    return _user;
}

var convertUserProfile = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.deviceID;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.__v;
    return _user;
}

var convertContactInfo = contact => {
    let _contact = JSON.parse(JSON.stringify(contact)) || {};

    let user = _contact.userID;
    user.remarkName = _contact.remarkName;
    user.userID = user._id;

    delete user._id;
    delete user.password;
    delete user.deviceID;
    delete user.__v;
    delete user.token;
    delete user.meta;
    delete user.status;
    delete user.role;

    return user;
}

var convertContacts = contactsData => {
    let _contactList = contactsData.contacts;
    if (!_contactList.length) return [];

    let convertContactsData = [];
    for (let i = 0; i < _contactList.length; i++) {
        let contact = _contactList[i];
        contact = convertContactInfo(contact);
        convertContactsData.push(contact);
    }
    return convertContactsData;
}

var convertSearchUserList = userList => {
    let _userList = JSON.parse(JSON.stringify(userList));
    if (!_userList.length) return [];

    let convertUserListData = [];
    for (let i = 0; i < _userList.length; i++) {
        let user = _userList[i];
        user = convertUserProfile(user);
        convertUserListData.push(user);
    }
    return convertUserListData;
}