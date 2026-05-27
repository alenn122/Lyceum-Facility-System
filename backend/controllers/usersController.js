const RfidUser     = require('../models/RfidUser');
const CourseSection = require('../models/CourseSection');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name:  { $regex: search, $options: 'i' } },
        { rfid_tag:   { $regex: search, $options: 'i' } },
      ];
    }

    const users = await RfidUser.find(filter)
      .populate('course_section', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await RfidUser.findById(req.params.id).populate('course_section', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const user = await RfidUser.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await RfidUser.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/users/:id  (soft delete — sets status to Archived)
const deleteUser = async (req, res) => {
  try {
    const user = await RfidUser.findByIdAndUpdate(
      req.params.id,
      { status: 'Archived', archived_date: new Date() },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User archived', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/sections  — for dropdowns
const getSections = async (req, res) => {
  try {
    const sections = await CourseSection.find().sort({ name: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getSections };
