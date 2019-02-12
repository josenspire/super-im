const _ = require('lodash');
const UserRepository = require("../repositories/user.repository");
const GroupRepository = require("../repositories/group.repository");

class DAOManager {
    async getUserProfileAndContactsAndGroups(token) {
        const verifyResult = await UserRepository.tokenVerify(token);
        return _.merge({}, verifyResult, await convertContactsAndGroups(verifyResult.userProfile));
    };

    async getUserProfileAndContactsAndGroupsByUserInfo(telephone, password) {
        const queryResult = await UserRepository.queryUserByTelephoneAndPassword(telephone, password);
        return _.merge({}, queryResult, await convertContactsAndGroups(queryResult.userProfile));
    };

    async createUserAndGetAllInfo(user, token) {
        const createResult = await UserRepository.createUser(user, token);
        return _.merge({}, createResult, await convertContactsAndGroups(createResult.userProfile));
    };

    async updateDeviceIDAndGetUserInfo(telephone, password, deviceID) {
        const updateResult = await UserRepository.updateDeviceID(telephone, password, deviceID);
        return _.merge({}, updateResult, await convertContactsAndGroups(updateResult.userProfile));
    };
}

const queryContactsAndGroups = async userID => {
    let result = {contacts: [], groups: []};
    result.contacts = await UserRepository.queryUserContactsByUserID(userID);
    result.groups = await GroupRepository.queryGroupList(userID);
    return result;
};

const convertContactsAndGroups = async userProfile => {
    let result = {
        contacts: [],
        groups: [],
    };
    if (userProfile) {
        const {userID} = userProfile;
        const {contacts, groups} = await queryContactsAndGroups(userID);
        result.contacts = contacts;
        result.groups = groups;
    }
    return result;
};

module.exports = new DAOManager();
