const UserDao = require('../dao/user.server.dao');
const DaoManager = require('../daoManager/dao.server.manager');
const Constants = require("../utils/Constants");
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

let IMProxie = require('../api/proxies/rongCloud.server.proxies')
let QiniuProxie = require('../api/proxies/qiniu.server.proxies')

const uuidv4 = require('uuid/v4');
const mongoose = require('mongoose')

// create user
exports.createUser = (user, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let userID = mongoose.Types.ObjectId();
    IMProxie.createUser(userID, user.nickname, null, response => {
        if (response.error) {
            console.log('---[IM CRETEUSER FAIL]---', response.error)
            result.message = response.error;
            return cb(result);
        }
        user._id = userID;
        DaoManager.createUserAndGetAllInfo(user, response.data, _result => {
            cb(_result);
        })
    })
}

// user login
exports.queryUserByTelephoneAndPassword = (telephone, password, deviceID, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, _user => {
        if (_user.status === SUCCESS) {
            if (_user.data.userProfile.deviceID != deviceID) {
                _user.data.userProfile = {};
                _user.data.verifyTelephone = true;
            } else {
                _user.data.verifyTelephone = false;
            }
        }
        cb(_user)
    })
}

// user login
exports.queryUserWithoutVerify = (telephone, password, cb) => {
    DaoManager.getUserProfileAndContactsAndGroupsByUserInfo(telephone, password, data => {
        cb(data);
    });
}

exports.tokenVerify = (token, cb) => {
    UserDao.tokenVerify(token, callback => {
        cb(callback);
    })
}

exports.tokenVerifyLogin = (token, cb) => {
    DaoManager.getUserProfileAndContactsAndGroups(token, callback => {
        cb(callback);
    })
}

exports.isTelephoneExist = (telephone, cb) => {
    UserDao.isTelephoneExist(telephone, isExist => {
        cb(isExist)
    })
}

// reset user's password
exports.resetPassword = (telephone, cb) => {
    UserDao.resetPassword(telephone, newpwd, _result => {
        cb(_result)
    })
}

exports.updateDeviceID = (telephone, password, deviceID, cb) => {
    DaoManager.updateDeviceIDAndGetUserInfo(telephone, password, deviceID, result => {
        cb(result);
    })
}

exports.getUserProfile = (userID, cb) => {
    UserDao.queryByUserID(userID, callback => {
        cb(callback)
    })
}

exports.updateUserProfile = (userID, userProfile, cb) => {
    UserDao.updateUserProfile(userID, userProfile, callback => {
        cb(callback);
    })
}

exports.updateUserAvatar = (userID, avatarUrl) => {
    return UserDao.updateUserAvatar(userID, avatarUrl);
}

exports.uploadAvatar = (telephone, cb) => {
    let fileName = telephone + '-' + uuidv4() + '.jpg';
    QiniuProxie.uploadAvatar(fileName, '/avatar/avatar.jpg')
        .then(result => {
            cb(result);
        })
        .catch(err => {
            cb(err);
        })
}

/** User Contacts Part */

exports.requestAddContact = (currentUser, contactID, message, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    let userID = currentUser.userID.toString();
    if (userID === contactID) {
        result.message = 'You can\'t add yourself to a contact';
        return cb(result);
    }
    UserDao.queryByUserID(contactID, async user => {
        if (user.status === SUCCESS) {
            try {
                let isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (isContact) {
                    result.message = "This user is already your contact";
                    cb(result);
                } else {
                    await IMProxie.sendContactNotification({
                        currentUser: currentUser,
                        contactID: contactID,
                        message: message,
                        operation: Constants.CONTACT_OPERATION_REQUEST,
                        userProfile: currentUser
                    });
                    cb(result);
                }
            } catch(err) {
                console.log(err);
            };
        } else {
            cb(user);
        }
    })
}

exports.acceptAddContact = (currentUser, contactID, remarkName, cb) => {
    let userID = currentUser.userID.toString();
    UserDao.acceptAddContact(userID, contactID, remarkName || '', async result => {
        if (result.status === SUCCESS) {
            try {
                const message = "You've added him to be a contact";
                await IMProxie.sendContactNotification({
                    currentUser: currentUser,
                    contactID: contactID,
                    message: message,
                    operation: Constants.CONTACT_OPERATION_ACCEPT,
                    userProfile: currentUser
                });
            } catch (err) {
                result.status = FAIL;
                result.data = {};
                result.message = err;
            }
        }
        cb(result)
    });
}

exports.rejectAddContact = async (currentUser, rejectUserID, rejectReason, cb) => {
    let result = { status: FAIL, data: {}, message: "" };

    let userID = currentUser.userID.toString();

    let isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, rejectUserID);
    if (isContact) {
        result.message = "Error operating, this user is already your contact";
        return cb(result);
    }
    await IMProxie.sendContactNotification({
        currentUser: currentUser,
        contactID: rejectUserID,
        message: rejectReason,
        operation: Constants.CONTACT_OPERATION_REJECT,
        userProfile: currentUser,
    });
    cb({ status: SUCCESS, data: {}, message: "" });
}

exports.deleteContact = (currentUser, contactID, cb) => {
    let userID = currentUser.userID.toString();

    UserDao.deleteContact(userID, contactID, result => {
        IMProxie.sendContactNotification({
            currentUser: currentUser,
            contactID: contactID,
            message: null,
            operation: Constants.CONTACT_OPERATION_DELETE,
            userProfile: currentUser,
        });
        cb(result);
    });
}

exports.updateRemark = (userID, contactID, remark, cb) => {
    UserDao.updateRemark(userID, contactID, remark, updateResult => {
        cb(updateResult);
    })
}

exports.getUserContacts = (userID, cb) => {
    UserDao.queryUserContactsByUserID(userID, userList => {
        cb(userList);
    })
}

exports.searchUserByTelephoneOrNickname = (queryCondition, pageIndex, cb) => {
    UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        cb(searchResult);
    })
}

exports.getBlackList = (telephone, cb) => {
    // TODO
    cb([])
}