const RSAUtil = require('../utils/RSAUtil');
const AESUtil = require('../utils/AESUtil');

const UserService = require('../services/user.server.service');

exports.RSA = {
    decryptParam2: (req, res, next) => {
        let params = req.body.params;
        console.log('---[INPUT DATA]---', params, typeof params)
        RSAUtil.privateDecrypt(params, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body.input = data;
            req.body.clientPublicKey
        })
        next();
    },

    encryptParam2: (req, res) => {
        let input = req.body.input;
        let publicKey = input ? input.params.clientPublicKey : "";
        let output = req.body.output;

        console.log('--[RESPONSE DATA]--', output)
        RSAUtil.publicEncryptObj(output, publicKey, params => {
            return res.json(params);
        })
    },


    decryptParam: (req, res, next) => {
        let params = req.body;
        console.log('---[INPUT DATA]---', params, typeof params)
        req.body.input = params;
        next();
    },
    encryptParam: (req, res) => {
        let output = req.body.output;
        console.log('--[RESPONSE DATA]--', output)
        return res.json(output);
    }
}

exports.AES = {
    decryptParam2: (req, res, next) => {
        let params = req.body.params;
        console.log('---[INPUT DATA]---', params, typeof params)
        AESUtil.decipher(params, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body.input = data;
            UserService.isTokenValid(data.token, isValid => {
                if (isValid.status != 200) {
                    return res.json(isValid)
                } else {
                    req.body.input.telephone = isValid.data.telephone;
                    next();
                }
            })
        })
    },

    encryptParam2: (req, res) => {
        let output = req.body.output;
        console.log('--[RESPONSE DATA]--', output)
        AESUtil.cipher(output, params => {
            return res.json(params);
        })
    },

    decryptParam: (req, res, next) => {
        let data = req.body;
        UserService.isTokenValid(data.token, isValid => {
            if (isValid.status != 200) {
                return res.json(isValid);
            } else {
                data.userID = isValid.data.userID;
                req.body.input = data;
                console.log('---[REQUEST DATA]---', data)
                next();
            }
        })
    },
    encryptParam: (req, res) => {
        let output = req.body.output;
        return res.json(output);
    }
}