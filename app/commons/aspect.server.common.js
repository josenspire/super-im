const ECDHHelper = require('../utils/ECDHHelper.js');
const {cipher, decipher} = require('../utils/AESHelper.js');
const UserService = require('../services/user.server.service.js');
const {SUCCESS, SIGNATURE_VERIFY_FAIL} = require('../utils/CodeConstants.js');

const ecdhHelper = ECDHHelper.getInstance();

class AspectControl {
    constructor() {
    };

    async handleRequest(req, res, next) {
        const {data, secretKey, signature} = req.body;
        console.log('---[REQUEST DATA]---', data, secretKey, signature);

        try {
            const secret = Buffer.from(ecdhHelper.computeSecret(secretKey), 'base64');
            const decipherText = decipher({cipherText: data, secret});
            const isVerifySuccess = ecdhHelper.verifySignatureByKJUR({
                data: decipherText,
                signature,
                publicKey: secretKey,
            });
            if (!isVerifySuccess) {
                const requestResult = buildRequestResult({status: SIGNATURE_VERIFY_FAIL});
                return res.json(buildResponseBody(requestResult, secret));
            }
            else {
                // should use token + deviceID verify, order to Prevent application of double opening
                /**
                 * @params {string} token
                 * @params {string} deviceID
                 * @params {Object} params
                 * @params {Object} extension
                 */
                const {token, deviceID, params, extension} = JSON.parse(decipherText);
                const isValid = await UserService.tokenVerify(token);
                if (isValid.status != SUCCESS) {
                    return res.json(isValid);
                } else {
                    req.input = {};
                    const {userProfile} = isValid.data;
                    params['currentUserID'] = userProfile.userID;
                    req.input = {params, extension};
                    req.user = userProfile;
                    next();
                }
            }
        }
        catch (err) {
            console.log(err);
            // return res.json(buildResponseBody(buildRequestResult({status: SERVER_ERROR, message: err.message}), ));
            return res.json({
                status: 401,
                data: {},
                message: err.message
            });
        }
    };

    async handleRequestTest(req, res, next) {
        req.input = req.body
        next();
    };

    handleResponse(req, res) {
        const output = req.output;
        console.log('---[RESPONSE DATA]---', output);
        return res.json(output);
        // return res.json(buildResponseBody(buildRequestResult({status: SERVER_ERROR, message: err.message}), ));
    };
};

const buildRequestResult = ({status = SUCCESS, data = {}, message = ''}) => {
    return JSON.stringify({status, data, message});
};

const buildResponseBody = (requestResult, secret) => {
    const response = {
        data: cipher({plainData: requestResult, secret}),
        signature: ecdhHelper.signatureByKJUR(requestResult),
    };
    return response;
};

module.exports = new AspectControl();
