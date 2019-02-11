const _ = require('lodash');
const UserRepository = require("../repositories/user.repository");
const GroupRepository = require("../repositories/group.repository");
const {SUCCESS} = require("../utils/CodeConstants");

class DAOManager {
    async getUserProfileAndContactsAndGroups(token) {
        const userData = await UserRepository.tokenVerify(token);
        if (userData.status != SUCCESS) {
            return userData
        }
        const {userID} = userData.data.userProfile || "";
        return await queryContactsAndGroups(userID);
    };

    async getUserProfileAndContactsAndGroupsByUserInfo(telephone, password) {
        const userData = await UserRepository.queryUserByTelephoneAndPassword(telephone, password);
        if (userData.status != SUCCESS) {
            return userData;
        }
        const {userID} = userData.data.userProfile;
        return await queryContactsAndGroups(userID);
    };

    async createUserAndGetAllInfo(user, token) {
        let createResult = await UserRepository.createUser(user, token);
        if (createResult.userProfile) {
            const {userID} = createResult.userProfile;
            const {contacts, groups} = await queryContactsAndGroups(userID);
            createResult.contacts = contacts;
            createResult.groups = groups;
        }
        return createResult;
    };

    async updateDeviceIDAndGetUserInfo(telephone, password, deviceID) {
        const userData = await UserRepository.updateDeviceID(telephone, password, deviceID);
        if (userData.status != SUCCESS) {
            return userData;   
        }

        const {userID} = userData.data.userProfile;
        return await queryContactsAndGroups(userID);
    };
};

var queryContactsAndGroups = async userID => {
    let result = {contacts: [], groups: []};
    result.contacts = await UserRepository.queryUserContactsByUserID(userID);
    result.groups = await GroupRepository.queryGroupList(userID);
    return result;
};

module.exports = new DAOManager();
