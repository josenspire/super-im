const UserDao = require('../dao/user.server.dao');
const DaoManager = require('../daoManager/dao.server.manager');
const Constants = require("../utils/Constants");
const {SUCCESS, FAIL} = require("../utils/CodeConstants");

const IMProxie = require('../api/proxies/rongCloud.server.proxies')
const QiniuProxie = require('../api/proxies/qiniu.server.proxies')

const uuidv4 = require('uuid/v4');
const mongoose = require('mongoose')

class UserService {
    // create user
    createUser(user, cb) {
        let result = {status: FAIL, data: {}, message: ""};
        const userID = mongoose.Types.ObjectId();
        IMProxie.createUser(userID, user.nickname, null, response => {
            if (response.error) {
                console.log('---[IM CRETEUSER FAIL]---', response.error)
                result.message = response.error;
                return cb(result);
            }
            user._id = userID;
            const _result = await DaoManager.createUserAndGetAllInfo(user, response.data);
            cb(_result);
        });
    };

    // user login
    async queryUserByTelephoneAndPassword(telephone, password, deviceID) {
        const user = await UserDao.queryUserByTelephoneAndPassword(telephone, password);
        if (user.status === SUCCESS) {
            if (user.data.userProfile.deviceID != deviceID) {
                user.data.userProfile = {};
                user.data.verifyTelephone = true;
            } else {
                user.data.verifyTelephone = false;
            }
        }
        return user;
    };

    // user login
    queryUserWithoutVerify(telephone, password, cb) {
        DaoManager.getUserProfileAndContactsAndGroupsByUserInfo(telephone, password, data => {
            cb(data);
        });
    };

    tokenVerify(token) {
        return UserDao.tokenVerify(token);
    };

    tokenVerifyLogin(token, cb) {
        DaoManager.getUserProfileAndContactsAndGroups(token, callback => {
            cb(callback);
        })
    }

    isTelephoneExist(telephone) {
        return UserDao.isTelephoneExist(telephone);
    }

    // reset user's password
    resetPassword(telephone) {
        return UserDao.resetPassword(telephone, newpwd);
    }

    updateDeviceID(telephone, password, deviceID) {
        return DaoManager.updateDeviceIDAndGetUserInfo(telephone, password, deviceID);
    }

    getUserProfile(userID) {
        return UserDao.queryByUserID(userID);
    }

    updateUserProfile(userID, userProfile) {
        return UserDao.updateUserProfile(userID, userProfile);
    }

    updateUserAvatar(userID, avatarUrl) {
        return UserDao.updateUserAvatar(userID, avatarUrl);
    }

    uploadAvatar(telephone, cb) {
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

    async requestAddContact(currentUser, contactID, message, cb) {
        let result = {status: FAIL, data: {}, message: ""};
        let userID = currentUser.userID.toString();
        if (userID === contactID) {
            result.message = 'You can\'t add yourself to a contact';
            return cb(result);
        }
        const user = await UserDao.queryByUserID(contactID);
        if (user.status === SUCCESS) {
            try {
                let isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (isContact) {
                    result.message = "This user is already your contact";
                    cb(result);
                } else {
                    result.status = SUCCESS;
                    await IMProxie.sendContactNotification({
                        currentUser: currentUser,
                        contactID: contactID,
                        message: message,
                        operation: Constants.CONTACT_OPERATION_REQUEST,
                        userProfile: currentUser
                    });
                    cb(result);
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            cb(user);
        }
    }

    async acceptAddContact(currentUser, contactID, remarkName) {
        let userID = currentUser.userID.toString();
        let result = await UserDao.acceptAddContact(userID, contactID, remarkName || '');
        if (result.status === SUCCESS) {
            try {
                const message = "You've added him to be a contact";
                await IMProxie.sendContactNotification({
                    currentUser: currentUser,
                    contactID: contactID,
                    message: message,
                    operation: Constants.CONTACT_OPERATION_ACCEPT,
                    userProfile: currentUser,
                    // objectName: 'RC:ContactNtf',
                    // isIncludeSender: 1,
                });
            } catch (err) {
                result.status = FAIL;
                result.data = {};
                result.message = err;
            }
        }
        return result;
    }

    async rejectAddContact (currentUser, contactID, rejectReason, cb) {
        let result = {status: FAIL, data: {}, message: ""};

        let userID = currentUser.userID.toString();

        let isContact = await
        UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
        if (isContact) {
            result.message = "Error operating, this user is not your contact";
            return cb(result);
        }

        const rejectResult = await
        IMProxie.sendContactNotification({
            currentUser: currentUser,
            contactID: contactID,
            message: rejectReason,
            operation: Constants.CONTACT_OPERATION_REJECT,
            userProfile: currentUser,
        });

        if (rejectResult === 200) {
            result.status = SUCCESS;
        } else {
            console.log(rejectResult);
            result.message = `Server Busy, Please checking your options and try again later`;
        }
        cb(result);
    }

    deleteContact(currentUser, contactID) {
        let userID = currentUser.userID.toString();

        const result = await UserDao.deleteContact(userID, contactID);
        await IMProxie.sendContactNotification({
            currentUser: currentUser,
            contactID: contactID,
            message: null,
            operation: Constants.CONTACT_OPERATION_DELETE,
            userProfile: currentUser,
        });
        return result;
    }

    updateRemark(userID, contactID, remark, cb) {
        return UserDao.updateRemark(userID, contactID, remark);
    }

    getUserContacts(userID) {
        return UserDao.queryUserContactsByUserID(userID);
    }

    searchUserByTelephoneOrNickname(queryCondition, pageIndex) {
        return UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex);
    }

    getBlackList(telephone, cb) {
        // TODO
        cb([])
    }
};

module.exports = new UserService();
