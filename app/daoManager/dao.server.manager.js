const UserDao = require("../repositories/user.server.dao");
const GroupDao = require("../repositories/group.server.dao");
const {SUCCESS} = require("../utils/CodeConstants");

class DAOManager {
    async getUserProfileAndContactsAndGroups(token) {
        const userData = await UserDao.tokenVerify(token);
        if (userData.status != SUCCESS) {
            return userData
        }
        const userID = userData.data.userProfile.userID || "";
        return await queryContactsAndGroups(userID, userData);
    };

    async getUserProfileAndContactsAndGroupsByUserInfo(telephone, password) {
        const userData = await UserDao.queryUserByTelephoneAndPassword(telephone, password);
        if (userData.status != SUCCESS) {
            return userData;
        }
        const userID = userData.data.userProfile.userID;
        const result = await queryContactsAndGroups(userID, userData);
        return result;
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

var queryContactsAndGroups = async (userID, userData) => {
    let result = JSON.parse(JSON.stringify(userData));
    const contactsData = await UserDao.queryUserContactsByUserID(userID);
    if (contactsData.status != SUCCESS) {
        return contactsData;
    }

    result.data.contacts = contactsData.data.contacts;
    const queryResult = await GroupDao.queryGroupList(userID);
    if (queryResult.status != SUCCESS) {
        return queryResult;
    }
    result.data.groups = queryResult.data.groups;
    return result;
};

module.exports = new DAOManager();
