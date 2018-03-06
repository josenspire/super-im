const UserDao = require("../dao/user.server.dao");
const GroupDao = require("../dao/group.server.dao");

exports.getUserProfileAndContactsAndGroups = (token, cb) => {
    UserDao.tokenVerify(token, userData => {
        if (userData.status != 200) return cb(userData);

        let result = JSON.parse(JSON.stringify(userData));
        let userID = result.data.userProfile.userID || "";
        UserDao.queryUserContactsByUserID(userID, contactsData => {
            if (contactsData.status != 200) return cb(contactsData);

            result.data.contacts = contactsData.data.contacts;
            GroupDao.queryGroupList(userID, groupsData => {
                if (groupsData.status != 200) return cb(groupsData);
                result.data.groups = groupsData.data.groups;

                return cb(result);
            });
        })
    })
}