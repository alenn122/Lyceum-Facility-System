const AccessLog  = require('../models/AccessLog');
const Classroom  = require('../models/Classroom');  // ← required so Mongoose knows the model for populate
const RfidUser   = require('../models/RfidUser');   // ← same for user populate

// GET /api/access-logs
const getAccessLogs = async (req, res) => {
  try {
    const { status, device_type, room_code, search, limit = 500, page = 1 } = req.query;
    const filter = {};
    if (status)      filter.status      = status;
    if (device_type) filter.device_type = device_type;

    // resolve room_code → ObjectId
    if (room_code) {
      const room = await Classroom.findOne({ room_code });
      if (room) filter.room = room._id;
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AccessLog.countDocuments(filter);

    const logs = await AccessLog.find(filter)
      .populate('user', 'first_name last_name role')
      .populate('room', 'room_code')
      .sort({ access_time: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formatted = logs.map(log => ({
      _id:         log._id,
      name:        log.user
                     ? `${log.user.first_name} ${log.user.last_name}`
                     : `Unknown (${log.rfid_tag})`,
      role:        log.user?.role ?? 'Unknown',
      rfid_tag:    log.rfid_tag,
      room:        log.room?.room_code ?? 'N/A',
      device_type: log.device_type,
      access_time: log.access_time,
      status:      log.status,
    }));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), logs: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/access-logs/stats
const getAccessLogStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [total, granted, denied, today] = await Promise.all([
      AccessLog.countDocuments(),
      AccessLog.countDocuments({ status: 'granted' }),
      AccessLog.countDocuments({ status: 'denied'  }),
      AccessLog.countDocuments({ access_time: { $gte: todayStart } }),
    ]);
    res.json({ total, granted, denied, today });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccessLogs, getAccessLogStats };