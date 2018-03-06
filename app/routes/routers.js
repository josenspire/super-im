const Index = require('../controllers/index')
const AsceptControl = require('../controllers/aspect.server.controller');
const UserControl = require('../controllers/user.server.controller');
const TempUserControl = require('../controllers/tempUser.server.controller');
const SMSControl = require('../controllers/sms.server.controller');
const GroupControl = require('../controllers/group.server.controller');
const CommunityControl = require('../controllers/community.server.controller');

const AESUtil = require('../utils/AESUtil');

let RSAAscept = AsceptControl.RSA;
let AESAscept = AsceptControl.AES;

let routers = app => {
    app.get('/', Index.index);

    // user auth api
    app.get('/v1/api/auth/getSecretKey', UserControl.getPublicKey);
    app.post('/v1/api/auth/register', RSAAscept.decryptParam, UserControl.register, RSAAscept.encryptParam);
    app.post('/v1/api/auth/login', RSAAscept.decryptParam, UserControl.login, RSAAscept.encryptParam);
    app.post('/v1/api/auth/logout', RSAAscept.decryptParam, UserControl.logout, RSAAscept.encryptParam);
    app.post('/v1/api/auth/tokenVerify', UserControl.tokenVerifyLogin);
    // sms
    app.post('/v1/api/auth/obtainSMSCode', RSAAscept.decryptParam, SMSControl.sendSMS, RSAAscept.encryptParam);
    app.post('/v1/api/auth/verifySMSCode', RSAAscept.decryptParam, SMSControl.verifyCode, RSAAscept.encryptParam);

    // user profile
    app.post('/v1/api/user/getUserProfile', AESAscept.decryptParam, UserControl.getUserProfile, AESAscept.encryptParam);
    app.post('/v1/api/user/updateUserProfile', AESAscept.decryptParam, UserControl.updateUserProfile, AESAscept.encryptParam);
    app.post('/v1/api/user/searchUser', AESAscept.decryptParam, UserControl.searchUserByTelephoneOrNickname, AESAscept.encryptParam);

    app.post('/v1/api/user/getTempUserID', AESAscept.decryptParam, TempUserControl.getTempUserID, AESAscept.encryptParam);
    app.post('/v1/api/user/getUserProfileByTempUserID', AESAscept.decryptParam, TempUserControl.getUserProfileByTempUserID, AESAscept.encryptParam);

    // TODO special api handle
    app.post('/v1/api/user/uploadAvatar', UserControl.uploadAvatar);
    app.post('/v1/api/user/uploadAvatarByBase64', UserControl.uploadAvatarByBase64);
    
    app.post('/v1/api/contact/getBlackList', AESAscept.decryptParam, UserControl.getBlackList, AESAscept.encryptParam);

    // contacts
    app.post('/v1/api/contact/requestContact', AESAscept.decryptParam, UserControl.requestAddContact, AESAscept.encryptParam);
    app.post('/v1/api/contact/acceptContact', AESAscept.decryptParam, UserControl.acceptAddContact, AESAscept.encryptParam);
    app.post('/v1/api/contact/rejectContact', AESAscept.decryptParam, UserControl.rejectAddContact, AESAscept.encryptParam);
    app.post('/v1/api/contact/deleteContact', AESAscept.decryptParam, UserControl.deleteContact, AESAscept.encryptParam);
    app.post('/v1/api/contact/updateRemark', AESAscept.decryptParam, UserControl.updateRemark, AESAscept.encryptParam);
    app.post('/v1/api/contact/getContacts', AESAscept.decryptParam, UserControl.getUserContacts, AESAscept.encryptParam);

    // group
    app.post('/v1/api/group/create', AESAscept.decryptParam, GroupControl.createGroup, AESAscept.encryptParam);
    app.post('/v1/api/group/add', AESAscept.decryptParam, GroupControl.addGroupMembers, AESAscept.encryptParam);
    app.post('/v1/api/group/join', AESAscept.decryptParam, GroupControl.joinGroup, AESAscept.encryptParam);
    app.post('/v1/api/group/kick', AESAscept.decryptParam, GroupControl.kickGroupMember, AESAscept.encryptParam);
    app.post('/v1/api/group/quit', AESAscept.decryptParam, GroupControl.quitGroup, AESAscept.encryptParam);
    app.post('/v1/api/group/dismiss', AESAscept.decryptParam, GroupControl.dismissGroup, AESAscept.encryptParam);
    app.post('/v1/api/group/rename', AESAscept.decryptParam, GroupControl.renameGroup, AESAscept.encryptParam);
    app.post('/v1/api/group/updateNotice', AESAscept.decryptParam, GroupControl.updateGroupNotice, AESAscept.encryptParam);
    app.post('/v1/api/group/updateAlias', AESAscept.decryptParam, GroupControl.updateGroupMemberAlias, AESAscept.encryptParam);
    app.post('/v1/api/group/getGroups', AESAscept.decryptParam, GroupControl.getGroupList, AESAscept.encryptParam);
    
    // community
    app.post('/v1/api/community/getUserCommunity', AESAscept.decryptParam, CommunityControl.getUserCommunity, AESAscept.encryptParam);
}

module.exports = routers;