const CommunityModel = require('../models/community.server.model')
const { SUCCESS, FAIL } = require("../utils/CodeConstants");

exports.queryCommunityByUserID = (userID, cb) => {
    let result = { status: FAIL, data: {}, message: "" };
    CommunityModel.findOne({ userID: userID, status: 1 }, (err, community) => {
        if (err) {
            result.message = "Server error, query community fail"
        } else if (!community) {
            result.message = "Sorry, this user has not open community "
        } else {
            result.data.community = convertCommunity(community);
            result.status = SUCCESS;
        }
        cb(result);
    })
}

var convertCommunity = community => {
    delete community._id;
    delete community.meta;
}
