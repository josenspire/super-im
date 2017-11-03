const RSAService = require('../services/rsa.server.service')
const CodeConstants = require('../utils/CodeConstants');

// create public and validate telephone
exports.generateKeys = (req, res) => {
    RSAService.generateKeys(cb => {
        return res.json(cb)
    })
}

// get server rsa public key
exports.getPublicKey = (req, res) => {
    RSAService.getPublicKey(cb => {
        return res.json({
            status: CodeConstants.SUCCESS,
            data: {
                secretKey: cb
            },
            message: 'Get secret key success.'
        })
    })
}

// get server rsa private key
exports.getPrivateKey = (req, res) => {
    RSAService.getPrivateKey(cb => {
        return res.json({
            status: CodeConstants.SUCCESS,
            data: {
                private: cb
            },
            message: 'Get private key success.'
        })
    })
}

//test
exports.publicEncrypt = (req, res) => {
    let clientPublicKey = req.body.clientPublicKey;
    let data = req.body.data
    RSAService.publicEncrypt(data, clientPublicKey, cb => {
        return res.json(cb)
    })
}

//test
exports.privateDecrypt = (req, res) => {
    let encryptText = req.body.encryptText
    RSAService.privateDecrypt(encryptText, cb => {
        return res.json(cb)
    })
}

//test
exports.privateEncrypt = (req, res) => {
    let data = req.body
    RSAService.privateEncrypt(JSON.stringify(data), cb => {
        return res.json(cb)
    })
}

//test
exports.publicDecrypt = (req, res) => {
    let encryptText = req.body.encryptText
    RSAService.publicDecrypt(encryptText, cb => {
        return res.json(cb)
    })
}