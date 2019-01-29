const {cipher, decipher} = require('../utils/AESHelper.js');
const UserService = require('../services/user.server.service.js');
const ECDHHelper = require('../utils/ECDHHelper.js');
const { SUCCESS, SIGNATURE_VERIFY_FAIL } = require('../utils/CodeConstants.js');

class AspectControl {
    constructor() {
        this.ecdhHelper = ECDHHelper.getInstance();
    };

    decryptParam(req, res, next) {
        const {content, secret, signData} = req.body;
        console.log('---[REQUEST DATA]---', content, secret, signData);
        const verifyResult = this.ecdhHelper.verifySignatureByKJUR({
            encryptText: content,
            signature: signData,
            publicKey: secret,
        });
        if (!verifyResult) {
            return res.json({
                content: '',
                signData: '',
            });
        }
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
    };

    encryptParam(req, res) {
        let output = req.data.output;
        console.log('---[RESPONSE DATA]---', output)
        return res.json(output);
    };

    buildResponseBody ({status = SUCCESS, data = {}, message = ''}) {
        const plainData = {status, data, message};
        return {
            content: cipher()
        };
    };
};

// module.exports = AspectControl;
