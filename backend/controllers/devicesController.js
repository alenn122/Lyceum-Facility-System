const Device = require('../models/Device');

// GET /api/devices
const getDevices = async (req, res) => {
  try {
    const { status, device_type } = req.query;
    const filter = {};
    if (status)      filter.status      = status;
    if (device_type) filter.device_type = device_type;

    const devices = await Device.find(filter)
      .populate('room', 'room_code floor')
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/devices/:id
const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('room', 'room_code floor');
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/devices
const createDevice = async (req, res) => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/devices/:id
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/devices/:id
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice };
