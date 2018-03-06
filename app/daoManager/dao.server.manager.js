const UserDao = require("../dao/user.server.dao");
const GroupDao = require("../dao/group.server.dao");

exports.getUserProfileAndContactsAndGroups = (token, cb) => {
    UserDao.tokenVerify(token, userData => {
        if (userData.status != 200) return cb(userData);

        let userID = userData.data.userProfile.userID || "";
        queryContactsAndGroups(userID, userData, result => {
            return cb(result);
        });
    })
}

exports.getUserProfileAndContactsAndGroupsByUserInfo = (telephone, password, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, userData => {
        if (userData.status != 200) return cb(userData);

        let userID = userData.data.userProfile.userID;
        queryContactsAndGroups(userID, userData, result => {
            return cb(result);
        });
    })
}

exports.createUserAndGetAllInfo = (user, token, cb) => {
    UserDao.createUser(user, token, userData => {
        if (userData.status != 200) return cb(userData);

        let userID = userData.data.userProfile.userID;
        queryContactsAndGroups(userID, userData, result => {
            return cb(result)
        });
    })
}

exports.updateDeviceIDAndGetUserInfo = (telephone, password, deviceID, cb) => {
    UserDao.updateDeviceID(telephone, password, deviceID, userData => {
        if (userData.status != 200) return cb(userData);

        let userID = userData.data.userProfile.userID;
        queryContactsAndGroups(userID, userData, result => {
            return cb(result)
        });
    })
}

var queryContactsAndGroups = (userID, userData, cb) => {
    let result = JSON.parse(JSON.stringify(userData));

    UserDao.queryUserContactsByUserID(userID, contactsData => {
        if (contactsData.status != 200) return cb(contactsData);

        result.data.contacts = contactsData.data.contacts;
        GroupDao.queryGroupList(userID, groupsData => {
            if (groupsData.status != 200) return cb(groupsData);
            result.data.groups = groupsData.data.groups;

            cb(result);
        });
    })
}