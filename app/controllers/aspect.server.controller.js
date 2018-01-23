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
        // let data = JSON.parse(req.body);      //  special for text/plain type
        let data = JSON.parse(req.body);      //  special for text/plain type
        
        console.log('---[ORIGIN REQUEST DATA]---', req.body, typeof req.body)
        if (!data.token) {
            return res.json({
                status: 400,
                data: {},
                message: 'Parameters is incompleteness'
            })
        }
        console.log('---[REQUEST DATA]---', data, typeof data)
        req.data = {};
        UserService.isTokenValid(data.token, isValid => {
            if (isValid.status != 200) {
                return res.json(isValid);
            } else {
                data.params.userID = isValid.data.userID;
                req.data.input = data.params;
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