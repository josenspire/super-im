const TempUserService = require('../services/tempUser.server.service')

exports.getTempUserID = (req, res, next) => {
    let input = req.data.input;
    let userID = input.userID;

    TempUserService.getTempUserID(userID, result => {
        req.data.output = result;
        next();
    });
}

exports.getUserProfileByTempUserID = (req, res, next) => {
    let input = req.data.input;
    let tempUserID = input.tempUserID || "";
    TempUserService.getUserProfileByTempUserID(tempUserID, result => {
        req.data.output = result;
        next();
    });
}