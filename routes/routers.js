const Index = require('../app/controllers/index')
const User = require('../app/controllers/user.server.controller')
const SMS = require('../app/controllers/sms.server.controller')

let AsceptController = require('../app/controllers/aspect.server.controller');

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
    app.post('/v1/api/user/getUserProfile', User.getUserProfile);
    app.post('/v1/api/user/getUserFriends', User.getUserFriends);
    
    // app.post('/v1/api/auth/register', User.register);
    // app.post('/v1/api/auth/login', User.login);
    // app.post('/v1/api/auth/logout', User.logout)
    // app.post('/v1/api/auth/obtainSMSCode', SMS.sendSMS)
    // app.post('/v1/api/auth/verifySMSCode', SMS.verifyCode)

    // app.put('/v1/api/user/resetPassword', User.resetPassword);

    app.post('/v1/api/auth/accessCommonToken', User.accessCommonToken);
}

module.exports = routers;