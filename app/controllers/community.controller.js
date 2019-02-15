
const CommunityService = require('../services/community.service')

exports.getUserCommunity = (req, res, next) => {
    let input = req.data.input || {};
    CommunityService.getUserCommunity(input.userID, community => {
        req.body.output = community;
    });
}