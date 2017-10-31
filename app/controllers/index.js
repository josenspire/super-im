const AESUtil = require('../utils/AESUtil')

exports.index = (req, res) => {
    // let plainText = req.body.param.plainText
    // console.log(plainText)
    // AESUtil.cipher(plainText, cb => {
    //     AESUtil.decipher(cb, _cb => {
    //         return res.json({
    //             cipher: cb,
    //             decipher: _cb

    //         })
    //     })
    // })

    return res.render('index', {
        title: 'Hello Node!'
    })

    // let encrypt = new JSEncrypt();

    // let publicKey = fs.readFileSync('../configs/rsa_pub.pem');
    // encrypt.setPublicKey(publicKey);
    // let encrypted = encrypt.encrypt("Test 11111111.....");

    // console.log('------------===------------', encrypted)

    // // Decrypt with the private key...
    // let decrypt = new JSEncrypt();

    // let privateKey = fs.readFileSync('../configs/rsa_priv.pem');
    // decrypt.setPrivateKey(privateKey);
    // let decrypted = decrypt.decrypt(encrypt);

    // console.log('-------------------000----------------', decrypted)
}