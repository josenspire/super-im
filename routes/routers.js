const Index = require('../app/controllers/index')
const RsaKey = require('../app/controllers/rsa.server.controller')
const User = require('../app/controllers/user.server.controller')
const SMS = require('../app/controllers/sms.server.controller')

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
    app.post('/v1/api/auth/register', User.register);
    app.post('/v1/api/auth/login', User.login);
    app.post('/v1/api/auth/logout', User.logout)

    app.post('/v1/api/auth/obtainSMSCode', SMS.sendSMS)
    app.post('/v1/api/auth/verifySMSCode', SMS.verifyCode)

    // app.post('/v1/api/auth/:token', User.tokenAuth)
    // app.get('/v1/api/auth/:telephone', User.queryByTelephone);
}

module.exports = routers;