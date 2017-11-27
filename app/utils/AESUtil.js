const crypto = require('crypto');
const Constants = require('./Constants')
let ivText = "1234567812345678";

// let iv = Buffer.alloc(16);
// iv.write(ivText, 'utf8');

let iv = Buffer.alloc(16, '1');

exports.cipher = (data, cb) => {
    // const cipher = crypto.createCipher('aes-192-cbc', Constants.AES_SECRET);
    // let encrypted = cipher.update(data, 'utf8', 'base64');
    // encrypted += cipher.final('base64');
    // cb(encrypted)

    let clearEncoding = 'utf8';
    let cipherEncoding = 'base64';
    let cipherChunks = [];
    let cipher = crypto.createCipheriv('aes-128-cbc', Constants.AES_SECRET, iv);
    cipher.setAutoPadding(true);

    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));

    cb(cipherChunks.join(''));
}

exports.decipher = (cipherText, cb) => {
    // const decipher = crypto.createDecipher('aes-192-cbc', Constants.AES_SECRET);
    // let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    // decrypted += decipher.final('utf8');
    // cb(decrypted)

    let clearEncoding = 'utf8';
    let cipherEncoding = 'base64';
    let cipherChunks = [];
    let decipher = crypto.createDecipheriv('aes-128-cbc', Constants.AES_SECRET, iv);
    decipher.setAutoPadding(true);

    cipherChunks.push(decipher.update(cipherText, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));

    cb(cipherChunks.join(''));
}