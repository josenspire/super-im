let RSAUtil = require('../utils/RSAUtil')

exports.generateKeys = cb => {
    RSAUtil.generateKeys(_cb => {
        cb(_cb)
    })
}

exports.getPrivateKey = cb => {
    let privateKey = RSAUtil.getPrivateKey();
    cb(privateKey);
}

exports.getPublicKey = cb => {
    let publicKey = RSAUtil.getPublicKey();
    console.log(publicKey)
    cb(publicKey);
}

exports.publicEncrypt = (jsonObj, cb) => {
    RSAUtil.publicEncryptObj(jsonObj, clientPublicKey, _cb => {
        // RSAUtil.publicEncrypt(plainText, _cb => {
        cb(_cb)
    })
}

exports.privateDecrypt = (plainText, cb) => {
    RSAUtil.privateDecrypt(plainText, _cb => {
        cb(_cb)
    })
}

exports.privateEncrypt = (jsonObj, cb) => {
    RSAUtil.privateEncryptObj(jsonObj, _cb => {
        // RSAUtil.privateEncrypt(plainText, _cb => {
        cb(_cb)
    })
}

exports.publicDecrypt = (encryptText, cb) => {
    RSAUtil.publicDecrypt(encryptText, _cb => {
        cb(_cb)
    })
}