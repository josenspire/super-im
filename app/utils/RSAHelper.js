const fs = require('fs');
const path = require('path');
const Constants = require('../utils/Constants')

const {
  generateKeyPairSync,
  privateEncrypt,
  publicEncrypt,
  publicDecrypt,
  privateDecrypt,
  createSign,
  createVerify,
  constants,
} = require('crypto');

const dirPath = path.join(__dirname, '../../configs');

class RSAHelper {
  constructor() {
    // this.generateKeyPair()
  };

  generateKeyPair(modulusLength) {
    const {
      publicKey,
      privateKey
    } = generateKeyPairSync('rsa', {
      modulusLength: modulusLength || 1024,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      }
    });
    fs.writeFileSync(`${dirPath}/rsa_pub2.pem`, publicKey, err => {
      if (err) {
        console.log('--[CREATE_PUB_KEY]--', err);
        throw new Error(err.message);
      }
    });
    fs.writeFileSync(`${dirPath}/rsa_priv2.pem`, privateKey, err => {
      if (err) {
        console.log('--[CREATE_PRIV_KEY]--', err);
        throw new Error(err.message);
      }
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  };

  // encrypt by private key
  objectEncryptByPrivateKey(jsonObj) {
    jsonObj = JSON.stringify(jsonObj);
    console.log('Encrypt string: ', jsonObj)
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
      result = privateEncrypt({
        key: this.getPrivateKey(),
        padding: constants.RSA_PKCS1_PADDING
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
    return encryptBuff.toString('base64');
  };

  // encrypt plainText by public key
  encryptByPublicKey(plainText) {
    const encryptBuff = publicEncrypt({
      key: this.getPublicKey(),
      padding: constants.RSA_PKCS1_PADDING
    }, Buffer.from(plainText))
    return encryptBuff.toString('base64');
  };

  // encrypt Object by public key
  objectEncryptByPublicKey(data) {
    data = JSON.stringify(data);
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
      result = publicEncrypt({
        key: this.getPublicKey(),
        padding: constants.RSA_PKCS1_PADDING
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
    return encryptBuff.toString('base64');
  };

  // decrypt by private key
  decryptByPrivateKey(encryptText) {
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
        result = privateDecrypt({
          key: this.getPrivateKey(),
          padding: constants.RSA_PKCS1_PADDING,
        }, tempBuff);
        if (!decryptBuff) {
          decryptBuff = result;
          totalLength = result.length;
        } else
          totalLength = decryptBuff.length + result.length
        decryptBuff = Buffer.concat([decryptBuff, result], totalLength);
        i++;
        offSet = i * Constants.MAX_DECRYPT_BLOCK;
      }
      return JSON.parse(decryptBuff.toString());
    } catch (err) {
      console.log(err)
      throw new Error(err.message);
    }
  }

  // decrypt by public key
  decryptByPublicKey(encryptText) {
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
      result = publicDecrypt(this.getPublicKey(), tempBuff);
      if (!decryptBuff) {
        decryptBuff = result;
        totalLength = result.length;
      } else
        totalLength = decryptBuff.length + result.length
      decryptBuff = Buffer.concat([decryptBuff, result], totalLength);
      i++;
      offSet = i * Constants.MAX_DECRYPT_BLOCK;
    }
    return JSON.parse(decryptBuff.toString());
  }

  /**
   * @param   encryptText     string      desc: 加密体
   * @returns base64    desc: 签名
   */
  signature(encryptText) {
    let sign = createSign('SHA256');
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
   * @param   signature   base64      desc: 签名
   * @returns Boolean     desc: 验签结果
   */
  verifySignature(encryptText, signature) {
    const verify = createVerify('SHA256');
    verify.update(encryptText);
    return verify.verify(this.getPublicKey(), Buffer.from(signature, 'base64'));
  };

  getPublicKey() {
    return this.publicKey;
  };
  setPublicKey(publicKeyBase64) {
    this.publicKey = publicKeyBase64;
  };
  getPrivateKey() {
    return this.privateKey;
  };
  setPrivateKey(privateKeyBase64) {
    this.privateKey = privateKeyBase64;
  };
};

module.exports = new RSAHelper();