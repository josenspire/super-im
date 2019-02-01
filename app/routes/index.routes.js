const express = require('express');
const router = express.Router();
const Index = require('../controllers/index')
const {handleRequest} = require('../commons/aspect.common');

router.get('/', Index.index);
router.post('/test', handleRequest);

module.exports = router;