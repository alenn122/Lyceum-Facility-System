const express = require('express');
const router  = express.Router();
const { getAccessLogs, getAccessLogStats } = require('../controllers/accessLogsController');

router.get('/stats', getAccessLogStats);  // must be before /
router.get('/',      getAccessLogs);

module.exports = router;
