const CommunityDao = require('../dao/community.server.dao')
const UserDao = require('../dao/user.server.dao')

const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');

// obtain user's community information
exports.getUserCommunity = (userID, cb) => {
    CommunityDao.queryCommunityByUserID(userID, community => {
        cb(community)
    })
}
