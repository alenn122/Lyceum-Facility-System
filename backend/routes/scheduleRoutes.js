const express = require('express');
const router  = express.Router();
const {
  getSchedules, getArchivedSchedules, getScheduleById,
  createSchedule, updateSchedule, deleteSchedule, restoreSchedule,
  getSubjects, bulkImport,
} = require('../controllers/scheduleController');

// ⚠️ Specific routes MUST come before /:id
router.get('/subjects',        getSubjects);
router.get('/archived',        getArchivedSchedules);
router.post('/bulk-import',    bulkImport);
router.put('/:id/restore',     restoreSchedule);

router.get('/',                getSchedules);
router.get('/:id',             getScheduleById);
router.post('/',               createSchedule);
router.put('/:id',             updateSchedule);
router.delete('/:id',          deleteSchedule);

module.exports = router;