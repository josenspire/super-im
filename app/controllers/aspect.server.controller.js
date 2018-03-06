const RSAUtil = require('../utils/RSAUtil');
const AESUtil = require('../utils/AESUtil');

const UserService = require('../services/user.server.service');

exports.RSA = {
    decryptParam: (req, res, next) => {
        // let params = req.body.params;
        let params = req.body;          //  special for text/plain type
        req.data = {};
        console.log('---[INPUT DATA]---', params, typeof params)
        RSAUtil.privateDecrypt(params, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)

            req.data.input = data;
            req.data.clientPublicKey = data.params.clientPublicKey;
            next();
        })
    },

    encryptParam: (req, res) => {
        let input = req.data.input;
        let publicKey = input ? input.params.clientPublicKey : "";
        let output = req.data.output;

        console.log('--[RESPONSE DATA]--', output)
        RSAUtil.publicEncryptObj(output, publicKey, params => {
            return res.json(params);
        })
    }
}

exports.AES = {
    decryptParam: (req, res, next) => {
        let data = JSON.parse(req.body);      //  special for text/plain type
        // let data = req.body;

        console.log('---[REQUEST DATA]---', data, typeof data)
        if (!data.token) {
            return res.json({
                status: 400,
                data: {},
                message: 'Parameters is incompleteness'
            })
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
        })
    },
    encryptParam: (req, res) => {
        let output = req.data.output;
        console.log('---[RESPONSE DATA]---', output)
        return res.json(output);
    }
}