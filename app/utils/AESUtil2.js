const CryptoJS = require("crypto-js");

// let iv = Buffer.alloc(16, '1');
let iv = "1234567812345678";

const Constants = require('./Constants')

exports.cipher = (plaintText, cb) => {
    let result = CryptoJS.AES.encrypt(plaintText, CryptoJS.enc.Utf8.parse(Constants.AES_SECRET), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })

    cb(result.toString());
}

exports.decipher = (encryptText, cb) => {
    let result = CryptoJS.AES.decrypt(encryptText, CryptoJS.enc.Utf8.parse(Constants.AES_SECRET), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })
    cb(result.toString(CryptoJS.enc.Utf8))
}