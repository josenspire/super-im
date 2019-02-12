const express = require('express');
const router = express.Router();
const {
    getPublicKey,
    register,
    login,
    logout,
    tokenVerifyLogin
} = require('../controllers/user.controller');
const {sendSMS, verifyCode} = require('../controllers/sms.controller');

const AspectHelper = require('../commons/aspect.common.js');

router.get('/getSecretKey', getPublicKey);

router.post('/register', AspectHelper.handleRequestTest, register, AspectHelper.handleResponse);
router.post('/login', AspectHelper.handleRequestTest, login, AspectHelper.handleResponse);
router.post('/logout', AspectHelper.handleRequestTest, logout, AspectHelper.handleResponse);
router.post('/tokenVerify', tokenVerifyLogin);
// sms
router.post('/obtainSMSCode', AspectHelper.handleRequestTest, sendSMS, AspectHelper.handleResponse);
router.post('/verifySMSCode', AspectHelper.handleRequestTest, verifyCode, AspectHelper.handleResponse);

module.exports = router;