const crypto = require('crypto');
const Constants = require('./Constants')

exports.cipher = (data, cb) => {
    const cipher = crypto.createCipher('aes192', Constants.AES_SECRET);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    cb(encrypted)
}

exports.decipher = (cipherText, cb) => {
    const decipher = crypto.createDecipher('aes192', Constants.AES_SECRET);
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    cb(decrypted)
}