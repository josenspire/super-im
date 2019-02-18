const express = require('express');
const router = express.Router();
const {
    requestAddContact,
    acceptAddContact,
    rejectAddContact,
    deleteContact,
    updateRemark,
    getUserContacts,
} = require('../controllers/user.controller');
const AspectHelper = require('../commons/aspect.common.js');

router.post('/requestContact', AspectHelper.handleRequestWithTokenVerify, requestAddContact, AspectHelper.handleResponse);
router.post('/acceptContact', AspectHelper.handleRequestWithTokenVerify, acceptAddContact, AspectHelper.handleResponse);
router.post('/rejectContact', AspectHelper.handleRequestWithTokenVerify, rejectAddContact, AspectHelper.handleResponse);
router.post('/deleteContact', AspectHelper.handleRequestWithTokenVerify, deleteContact, AspectHelper.handleResponse);
router.post('/updateRemark', AspectHelper.handleRequestWithTokenVerify, updateRemark, AspectHelper.handleResponse);
router.post('/getContacts', AspectHelper.handleRequestWithTokenVerify, getUserContacts, AspectHelper.handleResponse);

module.exports = router;