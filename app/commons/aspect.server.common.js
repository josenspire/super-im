const ECDHHelper = require('../utils/ECDHHelper.js');
const {cipher, decipher} = require('../utils/AESHelper.js');
const UserService = require('../services/user.server.service.js');
const {SUCCESS, SIGNATURE_VERIFY_FAIL} = require('../utils/CodeConstants.js');

const ecdhHelper = ECDHHelper.getInstance();
class AspectControl {
    constructor() {};

    decryptParam(req, res, next) {
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
                req.data = {};
                UserService.tokenVerify(data.token, isValid => {
                    if (isValid.status != 200) {
                        return res.json(isValid);
                    } else {
                        let user = isValid.data.userProfile;
                        data.params.userID = user.userID;
                        req.data.input = data.params;
                        req.data.user = user;
                        next();
                    }
                });
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

    encryptParam(req, res) {
        let output = req.data.output;
        console.log('---[RESPONSE DATA]---', output)
        return res.json(output);
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
