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

router.post('/register', AspectHelper.handleRequest, register, AspectHelper.handleResponse);
router.post('/login', AspectHelper.handleRequest, login, AspectHelper.handleResponse);
router.post('/logout', AspectHelper.handleRequest, logout, AspectHelper.handleResponse);
router.post('/tokenVerify', tokenVerifyLogin);
// sms
router.post('/obtainSMSCode', AspectHelper.handleRequest, sendSMS, AspectHelper.handleResponse);
router.post('/verifySMSCode', AspectHelper.handleRequest, verifyCode, AspectHelper.handleResponse);

module.exports = router;