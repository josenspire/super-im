const TempUserService = require('../services/tempUser.service')
const {success, error} = require('../commons/response.common');

class TempUserController {
    async getTempUserID(req, res, next) {
        const {userID} = req.user;
        try {
            const result = await TempUserService.getTempUserID(userID);
            req.output = success(result);
        } catch (err) {
            req.output = error(err);
        }
        next();
    };

    async getUserProfileByTempUserID(req, res, next) {
        const {params} = req.input;
        try {
            const result = await TempUserService.getUserProfileByTempUserID(params.tempUserID);
            req.output = success(result);
        } catch (err) {
            req.output = error(err);
        }
        next();
    };
}

module.exports = new TempUserController();