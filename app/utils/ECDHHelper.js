const {
  createECDH,
  ECDH,
  getCurves,
  generateKeyPairSync,
  createSign,
  getHashes,
  createVerify
} = require('crypto');

const {
  writeFileSync
} = require('fs');
const {
  join
} = require('path');
const dirPath = join(__dirname, '../../configs');

class ECDHHelper {
  constructor() {
    // console.log(getCurves());
  };

  /**
   * @param {string} namedCurve 
   */
  generateKeyPair(namedCurve) {
    const {
      publicKey,
      privateKey
    } = generateKeyPairSync('ec', {
      publicExponent: 0x10001,
      namedCurve: namedCurve || 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'sec1',
        format: 'pem',
      }
    });
    writeFileSync(`${dirPath}/ecdh_pub.pem`, publicKey, err => {
      if (err) {
        console.log('--[CREATE_PUB_KEY]--', err);
        throw new Error(err.message);
      }
    });
    writeFileSync(`${dirPath}/ecdh_priv.pem`, privateKey, err => {
      if (err) {
        console.log('--[CREATE_PRIV_KEY]--', err);
        throw new Error(err.message);
      }
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  };

  alice() {
    const ecdh = createECDH('secp256k1');
    ecdh.setPrivateKey(this.getPrivateKey());
    return pkey;
  };

  bob(cmpKey) {
    const ecdh = createECDH('secp256k1');
    ecdh.generateKeys();
    const key = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAELMxJWGvqCoVejumijbLaXhjHupMmVvRjLHiQSRQN+wgaS49iFnNzm0GkaATW9YyqoxOfkuHjUZRl60POb5jPjg==`;
    const secret = ecdh.computeSecret(key, 'base64', 'base64');
    console.log('secret：', secret);
    return cmpKey;
  }
  decrypto(pkHex) {
    const ecdh = createECDH('secp256k1');
    ecdh.generateKeys('hex');
    this.privateKey = ecdh.getPrivateKey('base64');
    console.log('-=-=-=-=1', ecdh.getPublicKey('hex'));
    console.log('-=-=-=-=2', ecdh.getPrivateKey('hex'));
    // ecdh.setPrivateKey('74f333df40d6c206879285497b6f0eb162dc753fb565f74911157c186dc833ba', 'hex');

    // const secret = ecdh.computeSecret(pkHex, 'base64', 'base64');
    // console.log('secret：', secret);
    // return secret;
    return '';
  };

  getPrivateKey() {
    console.log(this.privateKey.toString('base64'));
    return this.privateKey.toString('base64');
  };
  /**
   * @param   encryptText     string      desc: 加密体
   * @returns base64    desc: 签名
   */
  signature(encryptText) {
    let sign = createSign('SHA256');
    try {
      sign.update(encryptText);
      return sign.sign(this.privateKey);
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
    return verify.verify(this.publicKey, Buffer.from(signature, 'base64'));
  };
};

module.exports = new ECDHHelper();