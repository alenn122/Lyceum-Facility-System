const express = require('express');
const router  = express.Router();
const { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice } = require('../controllers/devicesController');

router.get('/',      getDevices);
router.get('/:id',   getDeviceById);
router.post('/',     createDevice);
router.put('/:id',   updateDevice);
router.delete('/:id',deleteDevice);

module.exports = router;
