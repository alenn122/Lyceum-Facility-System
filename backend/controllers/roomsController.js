const Classroom = require('../models/Classroom');

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const rooms = await Classroom.find(filter).sort({ room_code: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Classroom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const room = await Classroom.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/rooms/:id
const updateRoom = async (req, res) => {
  try {
    const room = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const room = await Classroom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
