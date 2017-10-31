const crypto = require('crypto')
const Constants = require('../utils/Constants')
let fs = require('fs')

exports.generateKeys = cb => {
    // Generate James's keys...
    const james = crypto.createDiffieHellman(1024);
    const jamesKey = james.generateKeys('base64');

    let privateKey = james.getPrivateKey('utf8');
    let publicKey = james.getPublicKey('utf8');

    fs.writeFileSync('../configs/rsa_priv2.pem', privateKey, err => {
        if (err) console.log('--[CREATE_PRIV_KEY]--', err)
    })

    fs.writeFileSync('../configs/rsa_pub2.pem', publicKey, err => {
        if (err) console.log('--[CREATE_PUB_KEY]--', err)
    })

    global.privateKey = privateKey;
    global.publicKey = publicKey;
    cb({
        'Private Key': privateKey,
        'Publick Key': publicKey
    })
}

exports.getPrivateKey = () => {
    let privateKey = global.privateKey;
    if (!privateKey || privateKey === '') {
        try {
            privateKey = fs.readFileSync('./configs/rsa_priv.pem', 'utf8');
            global.privateKey = privateKey || '';
        } catch (err) {
            console.log(err)
        }
    }
    return privateKey;
}

exports.getPublicKey = () => {
    let publicKey = global.publicKey;
    if (!publicKey || publicKey === '') {
        try {
            publicKey = fs.readFileSync('./configs/rsa_pub.pem', 'utf8');
            global.publicKey = publicKey || '';
        } catch (err) {
            console.log(err)
        }
    }
    return publicKey;
}

// encrypt by private key
exports.privateEncryptObj = (jsonObj, cb) => {
    jsonObj = JSON.stringify(jsonObj);
    console.log(jsonObj)
    let plainBuff = Buffer.from(jsonObj);
    let plainLength = plainBuff.length;
    let offSet = 0;
    let i = 0;
    let encryptBuff = null;
    while (plainLength - offSet > 0) {
        let result = null;
        let tempBuff = null;
        let totalLength = 0;
        if (plainLength - offSet > Constants.MAX_ENCRYPT_BLOCK) {
            tempBuff = plainBuff.slice(offSet, offSet + Constants.MAX_ENCRYPT_BLOCK);
        } else {
            tempBuff = plainBuff.slice(offSet, plainLength);
        }
        result = crypto.privateEncrypt({ key: this.getPrivateKey(), padding: crypto.constants.RSA_PKCS1_PADDING }, tempBuff);
        if (!encryptBuff) {
            encryptBuff = result;
            totalLength = result.length;
        } else
            totalLength = encryptBuff.length + result.length
        encryptBuff = Buffer.concat([encryptBuff, result], totalLength);
        i++;
        offSet = i * Constants.MAX_ENCRYPT_BLOCK;
    }
    cb(encryptBuff.toString('base64'))
}

// encrypt plainText by public key
exports.publicEncrypt = (plainText, cb) => {
    let encryptBuff = crypto.publicEncrypt({ key: this.getPublicKey(), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(plainText))
    cb(encryptBuff.toString('base64'))
}

// encrypt Object by public key
exports.publicEncryptObj = (data, publicKey, cb) => {
    publicKey = '-----BEGIN PUBLIC KEY-----\n' + publicKey + '-----END PUBLIC KEY-----\n'
    data = JSON.stringify(data);
    console.log(data)
    let plainBuff = Buffer.from(data);
    let plainLength = plainBuff.length;
    let offSet = 0;
    let i = 0;
    let encryptBuff = null;
    while (plainLength - offSet > 0) {
        let result = null;
        let tempBuff = null;
        let totalLength = 0;
        if (plainLength - offSet > 86) {
            tempBuff = plainBuff.slice(offSet, offSet + 86);
        } else {
            tempBuff = plainBuff.slice(offSet, plainLength);
        }
        // result = crypto.publicEncrypt(this.getPublicKey(), tempBuff);
        result = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, tempBuff);
        if (!encryptBuff) {
            encryptBuff = result;
            totalLength = result.length;
        } else
            totalLength = encryptBuff.length + result.length
        encryptBuff = Buffer.concat([encryptBuff, result], totalLength);
        i++;
        offSet = i * 86;
    }
    cb(encryptBuff.toString('base64'))
}

// decrypt by private key
exports.privateDecrypt = (encryptText, cb) => {
    // let encryptBuff = Buffer.alloc(Constants.MAX_DECRYPT_BLOCK);
    // encryptBuff.write(encryptText, 'base64');
    // let decryptBuff = crypto.privateDecrypt({ key: this.getPrivateKey(), padding: crypto.constants.RSA_PKCS1_PADDING }, encryptBuff)
    // cb(JSON.parse(decryptBuff.toString()))
    try {
        let encryptBuff = Buffer.from(encryptText, "base64")
        let encryptLength = encryptBuff.length;
        let offSet = 0;
        let i = 0;
        let decryptBuff = null;
        while (encryptLength - offSet > 0) {
            let result = null;
            let tempBuff = null;
            let totalLength = 0;
            if (encryptLength - offSet > Constants.MAX_DECRYPT_BLOCK) {
                tempBuff = encryptBuff.slice(offSet, offSet + Constants.MAX_DECRYPT_BLOCK);
            } else {
                tempBuff = encryptBuff.slice(offSet, encryptLength);
            }
            result = crypto.privateDecrypt({ key: this.getPrivateKey(), padding: crypto.constants.RSA_PKCS1_PADDING }, tempBuff);
            // result = crypto.privateDecrypt(this.getPrivateKey(), tempBuff);

            if (!decryptBuff) {
                decryptBuff = result;
                totalLength = result.length;
            } else
                totalLength = decryptBuff.length + result.length
            decryptBuff = Buffer.concat([decryptBuff, result], totalLength);
            i++;
            offSet = i * Constants.MAX_DECRYPT_BLOCK;
        }
        cb(JSON.parse(decryptBuff.toString()))
    } catch (err) {
        console.log(err)
    }
}

// decrypt by private key
exports.publicDecrypt = (encryptText, cb) => {
    let encryptBuff = Buffer.from(encryptText, "base64")
    let encryptLength = encryptBuff.length;
    let offSet = 0;
    let i = 0;
    let decryptBuff = null;
    while (encryptLength - offSet > 0) {
        let result = null;
        let tempBuff = null;
        let totalLength = 0;
        if (encryptLength - offSet > Constants.MAX_DECRYPT_BLOCK) {
            tempBuff = encryptBuff.slice(offSet, offSet + Constants.MAX_DECRYPT_BLOCK);
        } else {
            tempBuff = encryptBuff.slice(offSet, encryptLength);
        }
        result = crypto.publicDecrypt(this.getPublicKey(), tempBuff);
        if (!decryptBuff) {
            decryptBuff = result;
            totalLength = result.length;
        } else
            totalLength = decryptBuff.length + result.length
        decryptBuff = Buffer.concat([decryptBuff, result], totalLength);
        i++;
        offSet = i * Constants.MAX_DECRYPT_BLOCK;
    }
    cb(JSON.parse(decryptBuff.toString()))
}

// using private key sign passphrase
exports.signature = (plainText, cb) => {
    let sign = crypto.createSign('SHA256');
    try {
        sign.update(plainText);
        let privateKey = this.getPrivateKey();
        let result = sign.sign(privateKey, 'base64');
        cb(result)
    } catch (err) {
        console.log(err)
    }
}