const {createECDH, generateKeyPairSync, createSign, createVerify} = require('crypto');
const {writeFileSync, readFileSync} = require('fs');
const {KEYUTIL, KJUR, hextob64, b64tohex, stob64, b64toutf8} = require('jsrsasign');

const {join} = require('path');
const dirPath = join(__dirname, '../../configs');

const SECP256K1 = "secp256k1";
const PRIME256V1 = "prime256v1";
const P256 = "P-256";

class ECDHHelper {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ECDHHelper();
        }
        return this.instance;
    };

    constructor() {
        const privateKey = readFileSync(`${dirPath}/ecdh_priv_p256.pem`).toString();
        const publicKey = readFileSync(`${dirPath}/ecdh_pub_p256.pem`).toString();
        const {pubKeyHex, prvKeyHex} = KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKey);
        this.privateKeyPEM = privateKey;
        this.publicKeyPEM = publicKey;
        this.privateKeyPointHex = prvKeyHex;
        this.publicKeyPointHex = pubKeyHex;
    };

    /**
     * Generate ECC key pair
     * @param {string} namedCurve   curve secp256k1/secp256k1/...
     */
    generateKeyPair(namedCurve) {
        const {publicKey, privateKey} = generateKeyPairSync('ec', {
            publicExponent: 0x10001,
            namedCurve: namedCurve || 'prime256v1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
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
        this.privateKeyPEM = publicKey;
        this.publicKeyPEM = privateKey;
    };

    /**
     * Compute secret by other base public key
     * @param otherPublicKey
     * @returns {string | base64}
     */
    computeSecret(otherPublicKey) {
        try {
            return this.computeSecretByPEM(generateBaseKeyToPEM(otherPublicKey));
        } catch (err) {
            throw new Error(`Unsuccessful negotiation, please check your key`);
        }
    };

    /**
     * Compute secret by public key PEM
     * @param {base64} otherPublicKeyPoint   ecdh public key from other client/server
     * @returns {string | base64} secret key
     */
    computeSecretByPEM(otherPublicKeyPEM) {
        const {pubKeyHex} = KEYUTIL.getKey(otherPublicKeyPEM);
        const ecdh = createECDH(P256);
        ecdh.setPrivateKey(hextob64(this.privateKeyPointHex), 'base64');
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
            return sign.sign(this.privateKeyPEM);
        } catch (err) {
            console.log(err)
            throw new Error(err);
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
        return verify.verify(this.publicKeyPEM, Buffer.from(signature, 'base64'));
    };

    /**
     * Signature by private, from Jsrsasign.js
     * @param {string | object} data encrypt plain text
     * @returns {base64}  signature text
     */
    signatureByECDSA(data) {
        try {
            const sig = new KJUR.crypto.Signature({
                'alg': 'SHA1withECDSA'
            });
            console.log(this.privateKeyPEM);
            sig.init(this.privateKeyPEM);
            sig.updateString(data);
            return hextob64(sig.sign());
        } catch (err) {
            throw new Error(err);
        }
    };

    /**
     * Verify signature by public key, from Jsrsasign.js
     * @param {string} data
     * @param {base64} signature
     * @param {base64} publicKey
     * @returns {Boolean}   verify result
     */
    verifySignatureByECDSA({data, signature, publicKey}) {
        const sig = new KJUR.crypto.Signature({
            'alg': 'SHA1withECDSA'
        });
        sig.init(generateBaseKeyToPEM(publicKey));
        sig.updateString(data);
        return sig.verify(b64tohex(signature));
    };

    /**
     * https://blog.csdn.net/qq_26288303/article/details/86301336#commentBox
     *
     * 由于go的ecdsa验签过程中对签名进行asn1解析过程与jsrsasign库的asn1加密过程不一致
     * 只能传输R、S两个大整数转换后的十六进制字符串
     *
     * This signature will return "r","s" bigInt, order to support integration with Golang,
     * just can transform "r", "s" to Golang backend, Separate with a colon(":")
     * @param {string} hexData
     * @returns {string} signature base64 text, decode is "r:s" string; r,s -> hex
     */
    signatureByECDSAForGolang({hexData, privateKeyPointHex}) {
        const ec = new KJUR.crypto.ECDSA({
            "curve": P256,
        });
        const sign = ec.signHex(hexData, privateKeyPointHex);
        const parseSigHexInHexRS = KJUR.crypto.ECDSA.parseSigHexInHexRS(sign);
        const rsHex = parseSigHexInHexRS.r + ":" + parseSigHexInHexRS.s;
        return stob64(rsHex);
    };

    /**
     * Handle ecdsa signature verify for Golang
     * @param {hexData} data
     * @param {string} signature {r: '', s: ''}
     * @param {string | base64} publicKey
     */
    verifySignatureByECDSAForGolang({hexData, signature, publicKey}) {
        const ec = new KJUR.crypto.ECDSA({
            "curve": P256
        });
        const {r, s} = handleSignature(signature);
        console.log("======", hexData, r, s);
        const sign = KJUR.crypto.ECDSA.hexRSSigToASN1Sig(r, s);
        const publicKeyHex = KEYUTIL.parsePublicPKCS8Hex(b64tohex(publicKey));
        return ec.verifyHex(hexData, sign, publicKeyHex.key);
    };

    getBasePublicKey() {
        return generatePEMToBaseKey(this.publicKeyPEM);
    };
}

/**
 * Generate base key to PEM, add 'BEGIN/END'
 * @param {base64} baseKey
 * @returns {string} PEM string
 */
const generateBaseKeyToPEM = baseKey => {
    return `-----BEGIN PUBLIC KEY-----\n${baseKey}\n-----END PUBLIC KEY-----`;
};

/**
 * Generate PEM to base key, remove 'BEGIN/END'
 * @param {base64} keyPEM
 * @returns {string} base string
 */
const generatePEMToBaseKey = keyPEM => {
    const keys = keyPEM.split('\n');
    return keys[1] + keys[2];
};

const handleSignature = signature => {
    const signatureStr = b64toutf8(signature);
    const rs = signatureStr.split(':');
    if (rs.length <= 1) {
        throw new Error(`Signature is invalid`)
    }
    return {
        r: rs[0],
        s: rs[1],
    }
};

module.exports = ECDHHelper;