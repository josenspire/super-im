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
    createUser(user) {
        let result = {status: FAIL, data: {}, message: ""};
        const userID = mongoose.Types.ObjectId();
        return new Promise((resolve, reject) => {
            IMProxie.createUser(userID, user.nickname, null, async response => {
                if (response.error) {
                    console.log('---[IM CRETEUSER FAIL]---', response.error)
                    result.message = response.error;
                    return resolve(resolve);
                }
                user._id = userID;
                const _result = await DaoManager.createUserAndGetAllInfo(user, response.data);
                resolve(_result);
            });
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
    queryUserWithoutVerify(telephone, password) {
        return DaoManager.getUserProfileAndContactsAndGroupsByUserInfo(telephone, password);
    };

    tokenVerify(token) {
        return UserDao.tokenVerify(token);
    };

    tokenVerifyLogin(token) {
        return DaoManager.getUserProfileAndContactsAndGroups(token);
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

    async uploadAvatar(telephone) {
        const fileName = telephone + '-' + uuidv4() + '.jpg';
        try {
            return await QiniuProxie.uploadAvatar(fileName, '/avatar/avatar.jpg');
        }
        catch (err) {
            throw new Error(err);
        }
    }

    /** User Contacts Part */
    async requestAddContact(currentUser, contactID, message) {
        let result = {status: FAIL, data: {}, message: ""};
        let userID = currentUser.userID.toString();
        if (userID === contactID) {
            result.message = 'You can\'t add yourself to a contact';
            return result;
        }
        const user = await UserDao.queryByUserID(contactID);
        if (user.status === SUCCESS) {
            try {
                const isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
                if (isContact) {
                    result.message = "This user is already your contact";
                } else {
                    result.status = SUCCESS;
                    await IMProxie.sendContactNotification({
                        currentUser: currentUser,
                        contactID: contactID,
                        message: message,
                        operation: Constants.CONTACT_OPERATION_REQUEST,
                        userProfile: currentUser
                    });
                }
                return result;
            } catch (err) {
                console.log(err);
            }
        } else {
            return user;
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

    async rejectAddContact (currentUser, contactID, rejectReason) {
        let result = {status: FAIL, data: {}, message: ""};
        const userID = currentUser.userID.toString();
        const isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
        if (isContact) {
            result.message = "Error operating, this user is not your contact";
            return result;
        }
        const rejectResult = await IMProxie.sendContactNotification({
            currentUser: currentUser,
            contactID: contactID,
            message: rejectReason,
            operation: Constants.CONTACT_OPERATION_REJECT,
            userProfile: currentUser,
        });

        if (rejectResult === SUCCESS) {
            result.status = SUCCESS;
        } else {
            console.log(rejectResult);
            result.message = `Server Busy, Please checking your options and try again later`;
        }
        return result;
    }

    async deleteContact(currentUser, contactID) {
        const userID = currentUser.userID.toString();

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

    updateRemark(userID, contactID, remark) {
        return UserDao.updateRemark(userID, contactID, remark);
    }

    getUserContacts(userID) {
        return UserDao.queryUserContactsByUserID(userID);
    }

    searchUserByTelephoneOrNickname(queryCondition, pageIndex) {
        return UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex);
    }

    getBlackList(telephone) {
        // TODO
        return [];
    }
};

module.exports = new UserService();
