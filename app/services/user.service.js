const _ = require('lodash');
const UserRepository = require('../repositories/user.repository');
const DaoManager = require('../daoManager/dao.manager');
const Constants = require("../utils/Constants");
const {SUCCESS, FAIL, SERVER_UNKNOW_ERROR, USER_IDENTIFY_VERIFY} = require("../utils/CodeConstants");
const TError = require('../commons/error.common');

const IMProxie = require('../api/proxies/rongCloud.server.proxies');
const QiniuProxie = require('../api/proxies/qiniu.server.proxies');
const uuidv4 = require('uuid/v4');
const mongoose = require('mongoose');

class UserService {
    // create user
    async createUser(user) {
        const userID = mongoose.Types.ObjectId();
        const CloudRegisterResult = await IMProxie.createUser({userID, nickname: user.nickname, avatar: null});
        user._id = userID;
        return await DaoManager.createUserAndGetAllInfo(user, CloudRegisterResult.token);
    };

    // user login
    async queryUserWithoutVerify(telephone, password, newDviceID) {
        const {user, deviceID} = await DaoManager.getUserProfileAndContactsAndGroupsByUserInfo(telephone, password);
        if (deviceID !== newDviceID) {
            throw new TError(USER_IDENTIFY_VERIFY, `System needs to verify your identity`);
        } else {
            return user;
        }
    };

    async refreshUserToken({userProfile, tokenID}) {
        const {token} = await IMProxie.refreshUserToken({
            userID: userProfile.userID,
            name: userProfile.nickname,
            portrait: userProfile.avatar,
        });
        await UserRepository.refreshUserToken({tokenID, token, userID: userProfile.userID});
        return token;
    };

    tokenVerify(token) {
        return UserRepository.tokenVerify(token);
    };

    tokenExpire(token) {
        return UserRepository.tokenExpire(token);
    };

    tokenVerifyLogin(token) {
        return DaoManager.getUserProfileAndContactsAndGroups(token);
    }

    isTelephoneExist(telephone) {
        return UserRepository.isTelephoneExist(telephone);
    }

    // reset user's password
    resetPassword(telephone) {
        return UserRepository.resetPassword(telephone, newpwd);
    }

    updateDeviceID(telephone, password, deviceID) {
        return DaoManager.updateDeviceIDAndGetUserInfo(telephone, password, deviceID);
    }

    getUserProfile(userID) {
        return UserRepository.queryByUserID(userID);
    }

    updateUserProfile(userID, userProfile) {
        UserRepository.updateUserProfile(userID, userProfile);
    }

    updateUserAvatar(userID, avatarUrl) {
        return UserRepository.updateUserAvatar(userID, avatarUrl);
    }

    async uploadAvatar(telephone) {
        const fileName = telephone + '-' + uuidv4() + '.jpg';
        try {
            return await QiniuProxie.uploadAvatar(fileName, '/avatar/avatar.jpg');
        } catch (err) {
            throw new Error(err);
        }
    };

    /** User Contacts Part */
    async requestAddContact(currentUser, contactID, message) {
        const userID = _.toString(currentUser.userID);
        if (userID === contactID) {
            throw new TError(FAIL, 'You can\'t add yourself to a contact');
        }
        await UserRepository.queryByUserID(contactID);
        const isContact = await UserRepository.checkContactIsExistByUserIDAndContactID(userID, contactID);
        if (isContact) {
            throw new TError(FAIL, "This user is already your contact");
        } else {
            try {
                await IMProxie.sendContactNotification({
                    currentUser: currentUser,
                    contactID: contactID,
                    message: message,
                    operation: Constants.CONTACT_OPERATION_REQUEST,
                    userProfile: currentUser
                });
            } catch (err) {
                throw new TError(SERVER_UNKNOW_ERROR, `Server error, ${err.message}`);
            }
        }
    };

    async acceptAddContact(currentUser, contactID, remarkName) {
        const userID = _.toString(currentUser.userID);
        const userProfile = await UserRepository.acceptAddContact(userID, contactID, remarkName || '');
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
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
        return userProfile;
    };

    async rejectAddContact(currentUser, contactID, rejectReason) {
        const userID = _.toString(currentUser.userID);
        const isContact = await UserRepository.checkContactIsExistByUserIDAndContactID(userID, contactID);
        if (isContact) {
            throw new TError(FAIL, "Error operating, this user is not your contact");
        }
        try {
            const rejectResult = await IMProxie.sendContactNotification({
                currentUser: currentUser,
                contactID: contactID,
                message: rejectReason,
                operation: Constants.CONTACT_OPERATION_REJECT,
                userProfile: currentUser,
            });
            if (rejectResult !== SUCCESS) {
                throw new TError(FAIL, `Server Busy, Please checking your options and try again later`);
            }
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    async deleteContact(currentUser, contactID) {
        const userID = _.toString(currentUser.userID);
        await UserRepository.deleteContact(userID, contactID);
        try {
            await IMProxie.sendContactNotification({
                currentUser: currentUser,
                contactID: contactID,
                message: null,
                operation: Constants.CONTACT_OPERATION_DELETE,
                userProfile: currentUser,
            });
        } catch (err) {
            throw new TError(SERVER_UNKNOW_ERROR, err.message);
        }
    };

    updateRemark({userID, contactID, contactRemark = "", description = "", telephones = "", tags = ""}) {
        return UserRepository.updateRemark({userID, contactID, contactRemark, description, telephones, tags});
    }

    getUserContacts(userID) {
        return UserRepository.queryUserContactsByUserID(userID);
    }

    searchUserByTelephoneOrNickname(queryCondition, pageIndex) {
        return UserRepository.searchUserByTelephoneOrNickname(queryCondition, pageIndex);
    }

    getBlackList(telephone) {
        // TODO
        return [];
    }
};

module.exports = new UserService();
