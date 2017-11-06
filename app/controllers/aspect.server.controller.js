const RSAUtil = require('../utils/RSAUtil');
const AESUtil = require('../utils/AESUtil');

exports.RSA = {
    decryptParam: (req, res, next) => {
        let param = req.body.param;
        RSAUtil.privateDecrypt(param, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body = data;
        })
        next();
    },

    encryptParam: (req, res) => {
        let data = req.body.data;
        let publicKey = req.body.publicKey;
        RSAUtil.publicEncryptObj(data, publicKey, param => {
            console.log('--[RESPONSE DATA]--', data)
            return res.json(param);
        })
    }
}

exports.AES = {
    decryptParam: (req, res, next) => {
        let param = req.body.param;
        AESUtil.decipher(param, data => {
            console.log('--[', req.path, ']--')
            console.log('--[REQUEST DATA]--', data)
            req.body = data;
        })
        next();
    },

    encryptParam: (req, res) => {
        let data = req.body;
        AESUtil.cipher(data, param => {
            console.log('--[RESPONSE DATA]--', data)
            return res.json(param);
        })
    }
}