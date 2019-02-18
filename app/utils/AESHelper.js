const {createCipheriv, createDecipheriv} = require('crypto');

const iv = Buffer.alloc(16, 0);
const clearEncoding = 'utf8';
const cipherEncoding = 'base64';
const algorithm = 'aes-256-cbc';

class AESHelper {
    constructor() {};

    /**
     * AES Cipher
     * @param {String} plainData JSON string
     * @param {Buffer} secret   secret key, 32 bit.
     * @returns {string}    encrypt data
     */
    cipher({plainData, secret}) {
        let cipherChunks = [];
        try {
            let cipher = createCipheriv(algorithm, secret, iv);
            cipher.setAutoPadding(true);

            cipherChunks.push(cipher.update(plainData, clearEncoding, cipherEncoding));
            cipherChunks.push(cipher.final(cipherEncoding));
            return cipherChunks.join('');
        }
        catch (err) {
            throw new Error(err);
        }
    };

    /**
     * AES Decipher
     * @param {Base64} cipherText   decipher data
     * @param {Buffer} secret   secret key, 32 bit.
     * @returns {string}    decrypt data
     */
    decipher({cipherText, secret}) {
        let cipherChunks = [];
        try {
            let decipher = createDecipheriv(algorithm, secret, iv);
            decipher.setAutoPadding(true);

            cipherChunks.push(decipher.update(cipherText, cipherEncoding, clearEncoding));
            cipherChunks.push(decipher.final(clearEncoding));
            return cipherChunks.join('');
        } catch (err) {
            console.log(err);
            throw new Error(err);
        }
    };
};

module.exports = new AESHelper();
