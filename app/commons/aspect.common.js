const _ = require('lodash');
const {tokenVerify, tokenExpire} = require('../services/user.service.js');
const ECDHHelper = require('../utils/ECDHHelper.js');
const {cipher, decipher} = require('../utils/AESHelper.js');
const {fail, error} = require('../commons/response.common');
const {FAIL, SIGNATURE_VERIFY_FAIL, TOKEN_INVALID_OR_EXPIRED, SERVER_DENIED_ACCESS} = require('../utils/CodeConstants.js');
const ecdhHelper = ECDHHelper.getInstance();

let secret = null;
class AspectControl {
    static async handleRequest(req, res, next) {
        const {data, secretKey, signature} = req.body;
        try {
            secret = Buffer.from(ecdhHelper.computeSecret(secretKey), 'base64');
        } catch (err) {
            console.log(err);
            return res.status(SERVER_DENIED_ACCESS).json();
        }

        try {
            const decipherText = decipher({cipherText: data, secret});
            const isVerifySuccess = ecdhHelper.verifySignatureByKJUR({
                data: decipherText,
                signature,
                publicKey: secretKey,
            });
            if (!isVerifySuccess) {
                req.output = (fail(SIGNATURE_VERIFY_FAIL, "Signature invalid"), secret);
                return AspectControl.handleResponse(req, res);
            }
            else {
                const {deviceID, params, extension} = JSON.parse(decipherText);
                console.log('---[REQUEST DATA]---', data, secretKey, signature);
                req.input = {
                    params,
                    deviceID,
                    extension,
                };
                req.user = {};
                next();
            }
        }
        catch (err) {
            console.log(err);
            // return res.json(buildResponseBody(buildRequestResult({status: SERVER_UNKNOW_ERROR, message: err.message}), ));
            req.output = error(err);
            return AspectControl.handleResponse(req, res);
        }
    };

    static async handleRequestWithTokenVerify (req, res, next) {
        const {data, secretKey, signature} = req.body;
        console.log('---[REQUEST DATA]---', data, secretKey, signature);
        try {
            secret = Buffer.from(ecdhHelper.computeSecret(secretKey), 'base64');
            const decipherText = decipher({cipherText: data, secret});
            const isVerifySuccess = ecdhHelper.verifySignatureByKJUR({
                data: decipherText,
                signature,
                publicKey: secretKey,
            });
            if (!isVerifySuccess) {
                req.output = (fail(SIGNATURE_VERIFY_FAIL, "Signature invalid"), secret);
                return AspectControl.handleResponse(req, res);
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
                if (!token) {
                    req.output = fail(FAIL, "Parameters is incompleteness");
                    return AspectControl.handleResponse(req, res);
                }
                req.input = {
                    params,
                    deviceID,
                    extension,
                };
                const user = await tokenVerify(token);
                if (user.deviceID != deviceID) {
                    // taking token expires
                    await tokenExpire(token);
                    req.output = fail(TOKEN_INVALID_OR_EXPIRED, `This token is invalid, please login again`);
                } else{
                    req.user = user;
                }
                next();
            }
        }
        catch (err) {
            console.log(err);
            // return res.json(buildResponseBody(buildRequestResult({status: SERVER_UNKNOW_ERROR, message: err.message}), ));
            req.output = error(err);
            return AspectControl.handleResponse(req, res);
        }
    };

    static async handleRequestTest(req, res, next) {
        req.input = req.body;
        next();
    };

    static async handleRequestWithTokenVerifyTest(req, res, next) {
        const requestData = req.body;
        const token = _.get(requestData, 'token');
        if (!token) {
            req.output = fail(FAIL, "Parameters is incompleteness");
            return AspectControl.handleResponse(req, res);
        }
        try {
            req.user = await tokenVerify(token);
        } catch (err) {
            req.output = error(err);
            return AspectControl.handleResponse(req, res);
        }
        req.input = requestData;
        next();
    };

    static handleResponse(req, res) {
        const responseData = req.output;
        console.log('---[RESPONSE DATA]---', responseData);
        if (!secret) {
            return res.status(SERVER_DENIED_ACCESS).json();
        }
        return res.json(buildResponseBody(JSON.stringify(responseData), secret));
    };

    static handleResponseTest(req, res) {
        const responseData = req.output;
        console.log('---[RESPONSE DATA]---', responseData);
        return res.json(responseData);
    };
}

const buildResponseBody = (requestResult, secret) => {
    return {
        data: cipher({plainData: requestResult, secret}),
        signature: ecdhHelper.signatureByKJUR(requestResult),
    };
};

module.exports = AspectControl;
