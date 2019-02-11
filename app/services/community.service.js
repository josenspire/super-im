const CommunityRepository = require('../repositories/community.repository')
const UserDao = require('../repositories/user.repository')

const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../utils/CodeConstants");

const Constants = require('../utils/Constants');

// obtain user's community information
exports.getUserCommunity = (userID, cb) => {
    CommunityRepository.queryCommunityByUserID(userID, community => {
        cb(community)
    })
}
