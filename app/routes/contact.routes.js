const express = require('express');
const router = express.Router();
const UserControl = require('../controllers/user.controller');
const AsceptControl = require('../controllers/aspect.controller');
let AESAscept = AsceptControl.AES;

router.post('/requestContact', AESAscept.decryptParam, UserControl.requestAddContact, AESAscept.encryptParam);
router.post('/acceptContact', AESAscept.decryptParam, UserControl.acceptAddContact, AESAscept.encryptParam);
router.post('/rejectContact', AESAscept.decryptParam, UserControl.rejectAddContact, AESAscept.encryptParam);
router.post('/deleteContact', AESAscept.decryptParam, UserControl.deleteContact, AESAscept.encryptParam);
router.post('/updateRemark', AESAscept.decryptParam, UserControl.updateRemark, AESAscept.encryptParam);
router.post('/getContacts', AESAscept.decryptParam, UserControl.getUserContacts, AESAscept.encryptParam);

module.exports = router;