const Index = require('../app/controllers/index')
const User = require('../app/controllers/user.server.controller')
const SMS = require('../app/controllers/sms.server.controller')

let AsceptController = require('../app/controllers/aspect.server.controller');

let AESUtil = require('../app/utils/AESUtil')

let RSAAscept = AsceptController.RSA;
let AESAscept = AsceptController.AES;

let routers = app => {
    app.get('/', Index.index);

    // user auth api
    app.get('/v1/api/auth/getSecretKey', User.getPublicKey);

    app.post('/v1/api/auth/register', RSAAscept.decryptParam, User.register, RSAAscept.encryptParam);
    app.post('/v1/api/auth/login', RSAAscept.decryptParam, User.login, RSAAscept.encryptParam);
    app.post('/v1/api/auth/logout', RSAAscept.decryptParam, User.logout, RSAAscept.encryptParam)

    app.post('/v1/api/auth/obtainSMSCode', RSAAscept.decryptParam, SMS.sendSMS, RSAAscept.encryptParam)
    app.post('/v1/api/auth/verifySMSCode', RSAAscept.decryptParam, SMS.verifyCode, RSAAscept.encryptParam)
    app.post('/v1/api/auth/autoLogin', RSAAscept.decryptParam, User.autoLoginByTokenAuth, RSAAscept.encryptParam)

    // user profile
    app.post('/v1/api/user/getUserProfile', AESAscept.decryptParam, User.getUserProfile, AESAscept.encryptParam);
    app.post('/v1/api/user/getUserFriends', AESAscept.decryptParam, User.getUserFriends, AESAscept.encryptParam);
    app.post('/v1/api/user/getBlackList', AESAscept.decryptParam, User.getBlackList, AESAscept.encryptParam);
    app.put('/v1/api/user/uploadAvatar', AESAscept.decryptParam, User.uploadAvatar, AESAscept.encryptParam);

    app.put('/v1/api/user/addFriend', User.addFriend, AESAscept.encryptParam)


    app.get('/encrypt', (req, res, next) => {
        let data = req.query.data;
        AESUtil.cipher(data, cb => {
            return res.json(cb)
        })
    })

    app.get('/dencrypt', (req, res, next) => {
        let data = req.query.data;
        AESUtil.decipher(data, cb => {
            return res.json(cb)
        })
    })

}

module.exports = routers;