const _ = require("lodash");

exports.randomString = len => {
    len = len || 64;
    const $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz1i234567809';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    const maxPos = $chars.length;
    let pwd = '';
    for (let i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

exports.randomCodeString = len => {
    let result = Math.floor(Math.random() * 89999) + 10000;
    return result + "";
}

exports.stringSubstr = (strings, maxLength) => {
    let result = _.cloneDeep(strings);
    if (result.length > maxLength) {
        result = result.substr(0, maxLength);
    }
    return result;
}