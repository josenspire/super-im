
const CommunityService = require('../services/community.service')
const UserService = require('../services/user.service')
const Constants = require('../utils/Constants');

exports.getUserCommunity = (req, res, next) => {
    let input = req.data.input || {};
    CommunityService.getUserCommunity(input.userID, community => {
        req.body.output = community;
    });
}