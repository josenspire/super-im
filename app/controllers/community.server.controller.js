
const CommunityService = require('../services/community.server.service')
const UserService = require('../services/user.server.service')
const Constants = require('../utils/Constants');

exports.getUserCommunity = (req, res, next) => {
    let input = req.data.input || {};
    CommunityService.getUserCommunity(input.userID, community => {
        req.body.output = community;
    });
}