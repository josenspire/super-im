
const CommunityService = require('../services/community.server.service')
const UserService = require('../services/user.server.service')
const CodeConstants = require('../utils/CodeConstants');
const Constants = require('../utils/Constants');

exports.getUserCommunity = (req, res, next) => {
    let input = req.body.input || {};
    CommunityService.getUserCommunity(input.userID, community => {
        req.body.output = community;
    });
}