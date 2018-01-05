const Index = require('../app/controllers/index')
const AsceptControl = require('../app/controllers/aspect.server.controller');
const UserControl = require('../app/controllers/user.server.controller')
const SMSControl = require('../app/controllers/sms.server.controller')
const CommunityControl = require('../app/controllers/community.server.controller')

const AESUtil = require('../app/utils/AESUtil')

let RSAAscept = AsceptControl.RSA;
let AESAscept = AsceptControl.AES;

let routers = app => {
    app.get('/', Index.index);

    // user auth api
    app.get('/v1/api/auth/getSecretKey', UserControl.getPublicKey);
    app.post('/v1/api/auth/register', RSAAscept.decryptParam, UserControl.register, RSAAscept.encryptParam);
    app.post('/v1/api/auth/login', RSAAscept.decryptParam, UserControl.login, RSAAscept.encryptParam);
    app.post('/v1/api/auth/logout', RSAAscept.decryptParam, UserControl.logout, RSAAscept.encryptParam);
    app.post('/v1/api/auth/tokenVerify', UserControl.isTokenValid);
    // sms
    app.post('/v1/api/auth/obtainSMSCode', RSAAscept.decryptParam, SMSControl.sendSMS, RSAAscept.encryptParam);
    app.post('/v1/api/auth/verifySMSCode', RSAAscept.decryptParam, SMSControl.verifyCode, RSAAscept.encryptParam);

    // user profile
    app.post('/v1/api/user/getUserProfile', AESAscept.decryptParam, UserControl.getUserProfile, AESAscept.encryptParam);
    app.post('/v1/api/user/updateUserProfile', AESAscept.decryptParam, UserControl.updateUserProfile, AESAscept.encryptParam);

    // TODO special api handle
    app.put('/v1/api/user/uploadAvatar', UserControl.uploadAvatar);
    app.post('/v1/api/user/getBlackList', AESAscept.decryptParam, UserControl.getBlackList, AESAscept.encryptParam);

    // contacts
    app.post('/v1/api/user/requestContact', AESAscept.decryptParam, UserControl.requestAddContact, AESAscept.encryptParam);
    app.post('/v1/api/user/acceptContact', AESAscept.decryptParam, UserControl.acceptAddContact, AESAscept.encryptParam);
    app.post('/v1/api/user/rejectContact', AESAscept.decryptParam, UserControl.rejectAddContact, AESAscept.encryptParam);
    app.post('/v1/api/user/deleteContact', AESAscept.decryptParam, UserControl.deleteContact, AESAscept.encryptParam);
    app.post('/v1/api/user/updateRemarkName', AESAscept.decryptParam, UserControl.updateRemarkName, AESAscept.encryptParam);
    app.post('/v1/api/user/getUserContacts', AESAscept.decryptParam, UserControl.getUserContacts, AESAscept.encryptParam);
    app.post('/v1/api/user/searchUser', AESAscept.decryptParam, UserControl.searchUserByTelephoneOrNickname, AESAscept.encryptParam);

    // community
    app.post('/v1/api/community/getUserCommunity', AESAscept.decryptParam, CommunityControl.getUserCommunity, AESAscept.encryptParam);
}

module.exports = routers;