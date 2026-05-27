const express = require('express');
const router  = express.Router();
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/roomsController');

router.get('/',      getRooms);
router.get('/:id',   getRoomById);
router.post('/',     createRoom);
router.put('/:id',   updateRoom);
router.delete('/:id',deleteRoom);

module.exports = router;
