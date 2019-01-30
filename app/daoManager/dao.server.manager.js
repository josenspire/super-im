const UserDao = require("../dao/user.server.dao");
const GroupDao = require("../dao/group.server.dao");
const {SUCCESS} = require("../utils/CodeConstants");

class DAOManager {
    getUserProfileAndContactsAndGroups(token, cb) {
        UserDao.tokenVerify(token, async userData => {
            if (userData.status != SUCCESS) return cb(userData);

            const userID = userData.data.userProfile.userID || "";
            const result = await queryContactsAndGroups(userID, userData);
            cb(result);
        })
    }

    getUserProfileAndContactsAndGroupsByUserInfo(telephone, password, cb) {
        UserDao.queryUserByTelephoneAndPassword(telephone, password, async userData => {
            if (userData.status != SUCCESS) return cb(userData);

            const userID = userData.data.userProfile.userID;
            const result = await queryContactsAndGroups(userID, userData);
            cb(result);
        })
    }

    async createUserAndGetAllInfo(user, token) {
        const createResult = await UserDao.createUser(user, token);
        if (createResult.status != SUCCESS) {
            return createResult;
        }
        const userID = createResult.data.userProfile.userID;
        const result = await queryContactsAndGroups(userID, createResult);
        return result;
    }

    async updateDeviceIDAndGetUserInfo(telephone, password, deviceID) {
        const userData = await UserDao.updateDeviceID(telephone, password, deviceID);
        if (userData.status != SUCCESS) {
            return userData;   
        }

        const userID = userData.data.userProfile.userID;
        const result = await queryContactsAndGroups(userID, userData);
        return result;
    };
};

var queryContactsAndGroups = (userID, userData) => {
    let result = JSON.parse(JSON.stringify(userData));
    const contactsData = await UserDao.queryUserContactsByUserID(userID);
    if (contactsData.status != SUCCESS) return cb(contactsData);

    result.data.contacts = contactsData.data.contacts;
    const queryResult = await GroupDao.queryGroupList(userID);
    if (queryResult.status != SUCCESS) {
        return queryResult;
    }
    result.data.groups = queryResult.data.groups;
    return result;
};

module.exports = new DAOManager();
