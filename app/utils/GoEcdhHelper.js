const {writeFileSync, readFileSync} = require('fs');
const {getCurves, createECDH, generateKeyPairSync} = require('crypto');
const {KEYUTIL, KJUR, hextob64, b64tohex, stob64, b64toutf8} = require('jsrsasign');

const {join} = require('path');
const dirPath = join(__dirname, '../../configs');

const CURVE_NAME = "prime256v1";
const P256 = "P-256";

class ECDHHelper {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ECDHHelper();
        }
        return this.instance;
    };

    constructor() {
        const curves = getCurves();

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
        writeFileSync(`${dirPath}/ecdh_pub2.pem`, publicKey, err => {
            if (err) {
                console.log('--[CREATE_PUB_KEY]--', err);
                throw new Error(err.message);
            }
        });
        writeFileSync(`${dirPath}/ecdh_priv2.pem`, privateKey, err => {
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
     * @param {string} otherPublicKey  as a base64 string
     * @returns {string} secret, base64 string
     */
    computeSecret(otherPublicKey) {
        try {
            return this.computeSecretByPEM(generateBaseKeyToPEM(otherPublicKey));
        } catch (err) {
            console.log(err);
            throw new Error(`Unsuccessful negotiation, please check your key`);
        }
    };

    /**
     * Compute secret by public key PEM
     * @param {string} otherPublicKeyPEM  ecdh public key from other client/server, include `BEGIN/END`
     * @returns {string} secret key, base64
     */
    computeSecretByPEM(otherPublicKeyPEM) {
        const {pubKeyHex} = KEYUTIL.getKey(otherPublicKeyPEM);
        const ecdh = createECDH(CURVE_NAME);
        ecdh.setPrivateKey(hextob64(this.privateKeyPointHex), 'base64');
        const secret = ecdh.computeSecret(pubKeyHex, 'hex', 'base64');
        console.log('[computed secret]：', secret);
        return secret;
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
 * @param {string} baseKey  as base64 string
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