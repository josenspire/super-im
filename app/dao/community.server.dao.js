const CommunityModel = require('../models/community.server.model')
const CodeConstants = require('../utils/CodeConstants')

exports.queryCommunityByUserID = (userID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: "" };
    CommunityModel.findOne({ userID: userID, status: 1 }, (err, community) => {
        if (err) {
            result.message = "Server error, query community fail"
        } else if (!community) {
            result.message = "Sorry, this user has not open community "
        } else {
            result.data.community = convertCommunity(community);
            result.status = CodeConstants.SUCCESS;
        }
        cb(result);
    })
}

var convertCommunity = community => {
    delete community._id;
    delete community.__v;
    delete community.meta;
}
