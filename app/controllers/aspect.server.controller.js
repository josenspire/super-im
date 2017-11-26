const RSAUtil = require('../utils/RSAUtil');
const AESUtil = require('../utils/AESUtil');

const UserService = require('../services/user.server.service');

exports.RSA = {
    decryptParam: (req, res, next) => {
        // let params = JSON.parse(req.body.params);
        let params = req.body.params;
        console.log('---[INPUT DATA]---', params, typeof params)
        RSAUtil.privateDecrypt(params, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body.input = data;
            req.body.clientPublicKey
        })
        // req.body.input = params;
        next();
    },

    encryptParam: (req, res) => {
        let input = req.body.input;
        let publicKey = input ? input.params.clientPublicKey : "";
        let output = req.body.output;
        
        console.log('--[RESPONSE DATA]--', output)
        RSAUtil.publicEncryptObj(output, publicKey, params => {
            return res.json(params);
        })
        // return res.json(output);
    }
}

exports.AES = {
    decryptParam: (req, res, next) => {
        // let params = JSON.parse(req.body.params);
        console.log(req.body)
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

    encryptParam: (req, res) => {
        let output = req.body.output;
        console.log('--[RESPONSE DATA]--', output)
        AESUtil.cipher(output, params => {
            return res.json(params);
        })
    }
}