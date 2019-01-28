const crypto = require('crypto')
const Constants = require('../utils/Constants')
const fs = require('fs')
const path = require('path');

exports.generateKeyPair = () => {
    const {
        publicKey,
        privateKey
    } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        }
    });

    const dirPath = path.join(__dirname, '../../configs');
    fs.writeFileSync(`${dirPath}/rsa_priv2.pem`, privateKey, err => {
        if (err) console.log('--[CREATE_PRIV_KEY]--', err)
    })

    fs.writeFileSync(`${dirPath}/rsa_pub2.pem`, publicKey, err => {
        if (err) console.log('--[CREATE_PUB_KEY]--', err)
    })
    return {
        publicKey,
        privateKey
    };
};

exports.generateKeys = () => {
    const dh = crypto.createDiffieHellman(1024);
    dh.generateKeys('base64');

    let privateKey = dh.getPrivateKey('base64');
    let publicKey = dh.getPublicKey('base64');

    const dirPath = path.join(__dirname, '../../configs');
    fs.writeFileSync(`${dirPath}/rsa_priv2.pem`, privateKey, err => {
        if (err) console.log('--[CREATE_PRIV_KEY]--', err)
    })

    fs.writeFileSync(`${dirPath}/rsa_pub2.pem`, publicKey, err => {
        if (err) console.log('--[CREATE_PUB_KEY]--', err)
    })

    global.privateKey = privateKey;
    global.publicKey = publicKey;
    return {
        'publicKey': publicKey,
        'privateKey': privateKey,
    };
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
        result = crypto.privateEncrypt({
            key: this.getPrivateKey(),
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, tempBuff);
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
    let encryptBuff = crypto.publicEncrypt({
        key: this.getPublicKey(),
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(plainText))
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
        result = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, tempBuff);
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
            result = crypto.privateDecrypt({
                key: this.getPrivateKey(),
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, tempBuff);
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
        cb(err)
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

/**
 * @param   encryptText     string      desc: 加密体
 * 
 * @returns String    desc: 签名
 */
exports.signature = encryptText => {
    let sign = crypto.createSign('SHA256');
    try {
        sign.update(encryptText);
        return sign.sign(this.getPrivateKey(), 'base64');
    } catch (err) {
        console.log(err)
        throw new Error(err.message);
    }
};

/**
 * @param   encryptText     string      desc: 加密体
 * @param   signature   string      desc: 签名
 * 
 * @returns Boolean     desc: 验签结果
 */
exports.verifySignature = (encryptText, signature) => {
    const verify = crypto.createVerify('SHA256');
    verify.update(encryptText);
    return verify.verify(this.getPublicKey(), signature);
};