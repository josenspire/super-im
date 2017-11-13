const RSAUtil = require('../utils/RSAUtil');
const AESUtil = require('../utils/AESUtil');

exports.RSA = {
    decryptParam: (req, res, next) => {
        let params = JSON.parse(req.body.params);
        console.log('---[INPUT DATA]---', params, typeof params)
        // RSAUtil.privateDecrypt(params, data => {
        //     console.log('--[', req.path, ']--')
        //     console.log('--[REQUEST DATA]--', data)
        //     req.body.input = data;
        // })
        req.body.input = params;
        next();
    },

    encryptParam: (req, res) => {
        let input = req.body.input;
        let publicKey = input ? input.clientPublicKey : "";
        let output = req.body.output;
        console.log('--[RESPONSE DATA]--', output)
        // RSAUtil.publicEncryptObj(output, publicKey, params => {
        //     return res.json(params);
        // })
        return res.json(output);
    }
}

exports.AES = {
    decryptParam: (req, res, next) => {
        let params = JSON.parse(req.body.params);
        AESUtil.decipher(params, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body.input = data;
        })
        next();
    },

    encryptParam: (req, res) => {
        let output = req.body.output;
        console.log('--[RESPONSE DATA]--', output)
        AESUtil.cipher(output, params => {
            return res.json(params);
        })
    }
}