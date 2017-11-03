const RSAUtil = require('./RSAUtil');

exports.RSAOperate = {
    decryptParam: (req, res, next) => {
        let param = req.body.param;
        RSAUtil.privateDecrypt(param, data => { req.body = data; })
        next();
    },

    encryptParam: (req, res) => {
        let data = req.body;
        RSAUtil.publicEncryptObj(data, param => { req.body = param; })
        return res.json(data);
    }
}