const {createCipheriv, createDecipheriv} = require('crypto');

const iv = Buffer.alloc(16, '1');

const clearEncoding = 'utf8';
const cipherEncoding = 'base64';
const algorithm = 'aes-128-cbc';

class AESHelper {
    cipher(plainData, secret) {
        let cipherChunks = [];
        let cipher = createCipheriv(algorithm, secret, iv);
        cipher.setAutoPadding(true);

        cipherChunks.push(cipher.update(plainData, clearEncoding, cipherEncoding));
        cipherChunks.push(cipher.final(cipherEncoding));
        return cipherChunks.join('');
    };

    decipher(cipherText, secret) {
        let cipherChunks = [];
        let decipher = createDecipheriv(algorithm, secret, iv);
        decipher.setAutoPadding(true);

        cipherChunks.push(decipher.update(cipherText, cipherEncoding, clearEncoding));
        cipherChunks.push(decipher.final(clearEncoding));
        return cipherChunks.join('');
    };
};

module.exports = new AESHelper();
