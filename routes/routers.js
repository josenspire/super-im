const Index = require('../app/controllers/index')
const RsaKey = require('../app/controllers/rsa.server.controller')
const User = require('../app/controllers/user.server.controller')
const SMS = require('../app/controllers/sms.server.controller')

let AsceptController = require('../app/controllers/aspect.server.controller');

let RSAAscept = AsceptController.RSA;
let AESAscept = AsceptController.AES;

let routers = app => {
    app.get('/', Index.index);

    // rsa key
    app.post('/v1/api/rsaKey/generate', RsaKey.generateKeys);
    app.post('/v1/api/rsaKey/encrypt/1', RsaKey.publicEncrypt);
    app.post('/v1/api/rsaKey/decrypt/1', RsaKey.privateDecrypt);
    app.post('/v1/api/rsaKey/encrypt/2', RsaKey.privateEncrypt);
    app.post('/v1/api/rsaKey/decrypt/2', RsaKey.publicDecrypt);
    // app.post('/v1/api/rsaKey/signature', RsaKey.signature);

    // user auth api
    app.get('/v1/api/auth/getSecretKey', RsaKey.getPublicKey);
    app.post('/v1/api/auth/register', RSAAscept.decryptParam, User.register, RSAAscept.encryptParam);
    app.post('/v1/api/auth/login', RSAAscept.decryptParam, User.login, RSAAscept.encryptParam);
    app.post('/v1/api/auth/logout', RSAAscept.decryptParam, User.logout, RSAAscept.encryptParam)

    app.post('/v1/api/auth/obtainSMSCode', RSAAscept.decryptParam, SMS.sendSMS, RSAAscept.encryptParam)
    app.post('/v1/api/auth/verifySMSCode', RSAAscept.decryptParam, SMS.verifyCode, RSAAscept.encryptParam)
    app.post('/v1/api/auth/autoLogin', RSAAscept.decryptParam, User.autoLoginByTokenAuth, RSAAscept.encryptParam)

    // app.post('/v1/api/auth/register', User.register);
    // app.post('/v1/api/auth/login', User.login);
    // app.post('/v1/api/auth/logout', User.logout)
    // app.post('/v1/api/auth/obtainSMSCode', SMS.sendSMS)
    // app.post('/v1/api/auth/verifySMSCode', SMS.verifyCode)
    // app.get('/v1/api/auth/:telephone', User.queryByTelephone);

    // app.put('/v1/api/user/resetPassword', User.resetPassword);
}

module.exports = routers;