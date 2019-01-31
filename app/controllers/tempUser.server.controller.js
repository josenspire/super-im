const TempUserService = require('../services/tempUser.server.service')

class TempUserController {
    async getTempUserID(req, res, next) {
        const input = req.data.input;
        const userID = input.userID;

        req.data.output = await TempUserService.getTempUserID(userID);
        next();
    };

    async getUserProfileByTempUserID(req, res, next) {
        const input = req.data.input;
        const tempUserID = input.tempUserID || "";
        req.data.output = await TempUserService.getUserProfileByTempUserID(tempUserID);
        next();
    };
};

module.exports = new TempUserController();