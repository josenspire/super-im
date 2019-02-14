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

router.post('/requestContact', AspectHelper.handleRequestWithTokenTest, requestAddContact, AspectHelper.handleResponse);
router.post('/acceptContact', AspectHelper.handleRequestWithTokenTest, acceptAddContact, AspectHelper.handleResponse);
router.post('/rejectContact', AspectHelper.handleRequestWithTokenTest, rejectAddContact, AspectHelper.handleResponse);
router.post('/deleteContact', AspectHelper.handleRequestWithTokenTest, deleteContact, AspectHelper.handleResponse);
router.post('/updateRemark', AspectHelper.handleRequestWithTokenTest, updateRemark, AspectHelper.handleResponse);
router.post('/getContacts', AspectHelper.handleRequestWithTokenTest, getUserContacts, AspectHelper.handleResponse);

module.exports = router;