const express = require('express');
const router = express.Router();
const Index = require('../controllers/index')
const {decryptParam} = require('../commons/aspect.server.common');

router.get('/', Index.index);
router.post('/test', decryptParam);

module.exports = router;