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