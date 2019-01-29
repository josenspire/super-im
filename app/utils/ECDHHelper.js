const {createECDH, generateKeyPairSync, createSign, createVerify} = require('crypto');
const {writeFileSync, readFileSync} = require('fs');
const {KEYUTIL, KJUR, hextob64, b64tohex} = require('jsrsasign');

const {join} = require('path');
const dirPath = join(__dirname, '../../configs');

class ECDHHelper {
    constructor() {
        const privateKey = readFileSync(`${dirPath}/ecdh_priv.pem`).toString();
        const publicKey = readFileSync(`${dirPath}/ecdh_pub.pem`).toString();
        const {pubKeyHex, prvKeyHex} = KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKey);

        this.privateKeyPEM = privateKey;
        this.publicKeyPEM = publicKey;
        this.privateKeyPoint = hextob64(prvKeyHex);
        this.publicKeyPoint = hextob64(pubKeyHex);
    };

    static getInstance() {
        if (!this.instance) {
            this.instance = new ECDHHelper();
        }
        return this.instance;
    }

    /**
     * Generate ECC key pair
     * @param {string} namedCurve   curve secp256k1/secp256v1/...
     */
    generateKeyPair(namedCurve) {
        const {publicKey, privateKey} = generateKeyPairSync('ec', {
            publicExponent: 0x10001,
            namedCurve: namedCurve || 'secp256k1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            }
        });
        writeFileSync(`${dirPath}/ecdh_pub1.pem`, publicKey, err => {
            if (err) {
                console.log('--[CREATE_PUB_KEY]--', err);
                throw new Error(err.message);
            }
        });
        writeFileSync(`${dirPath}/ecdh_priv1.pem`, privateKey, err => {
            if (err) {
                console.log('--[CREATE_PRIV_KEY]--', err);
                throw new Error(err.message);
            }
        });
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    };

    /**
     * Generate base key to PEM, add 'BEGIN/END'
     * @param {base64} baseKey
     * @returns {string} PEM string
     */
    generateBaseKeyToPEM(baseKey) {
        return `-----BEGIN PUBLIC KEY-----\n${baseKey}\n-----END PUBLIC KEY-----`;
    };

    /**
     * Generate PEM to base key, remove 'BEGIN/END'
     * @param {base64} keyPEM
     * @returns {string} base string
     */
    generatePEMToBaseKey(keyPEM) {
         const keys = keyPEM.split('\n');
         return keys[1] + keys[2];
    };

    /**
     * Compute secret by public key PEM
     * @param {base64} otherPublicKeyPoint   ecdh public key from other client/server
     * @returns {string | base64} secret key
     */
    computeSecret(otherPublicKeyPEM) {
        const {pubKeyHex} = KEYUTIL.getKey(otherPublicKeyPEM);
        const ecdh = createECDH('secp256k1');
        ecdh.setPrivateKey(this.privateKeyPoint, 'base64');
        const secret = ecdh.computeSecret(hextob64(pubKeyHex), 'base64', 'base64');
        console.log('[secret]：', secret);
        return secret;
    };

    /**
     * Signature by private key, from crypto.js
     * @param encryptText
     * @returns {hex}   signature result
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
     * Verify signature by crypto.js
     * @param encryptText
     * @param signature
     * @returns {Boolean}
     */
    verifySignature(encryptText, signature) {
        const verify = createVerify('SHA256');
        verify.update(encryptText);
        return verify.verify(this.publicKey, Buffer.from(signature, 'base64'));
    };

    /**
     * Signature by private, from Jsrsasign.js
     * @param {base64} encryptText encrypt plain text
     * @returns {base64}  signature
     */
    signatureByKJUR(encryptText) {
        const sig = new KJUR.crypto.Signature({
            'alg': 'SHA1withECDSA'
        });
        sig.init(this.privateKey);
        sig.updateString(encryptText);
        return hextob64(sig.sign());
    };

    /**
     * Verify signature by public key, from Jsrsasign.js
     * @param {base64} encryptText
     * @param {base64} signature
     * @param {base64} publicKey
     * @returns {Boolean}   verify result
     */
    verifySignatureByKJUR({encryptText, signature, publicKey}) {
        const sig = new KJUR.crypto.Signature({
            'alg': 'SHA1withECDSA'
        });
        sig.init(publicKey);
        sig.updateString(encryptText);
        return sig.verify(b64tohex(signature));
    };

    getBasePublicKey() {
        return this.generatePEMToBaseKey(this.publicKeyPEM);
    };
};

module.exports = ECDHHelper;