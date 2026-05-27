const AccessLog  = require('../models/AccessLog');
const Classroom  = require('../models/Classroom');
const User       = require('../models/User');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const [totalRooms, totalUsers, occupiedRooms] = await Promise.all([
      Classroom.countDocuments(),
      User.countDocuments({ status: 'Active' }),
      Classroom.countDocuments({ status: 'Occupied' }),
    ]);

    res.json({
      totalRooms,
      totalUsers,
      occupiedRooms,
      unoccupiedRooms: totalRooms - occupiedRooms,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/dashboard/recent-access
const getRecentAccess = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const logs = await AccessLog.find()
      .sort({ access_time: -1 })
      .limit(limit)
      .populate('user', 'first_name last_name role')
      .populate('room', 'room_code');

    const formatted = logs.map(log => ({
      _id:    log._id,
      name:   log.user
                ? `${log.user.first_name} ${log.user.last_name}`
                : `Unknown (${log.rfid_tag})`,
      role:   log.user?.role ?? 'Unknown',
      room:   log.room?.room_code ?? 'N/A',
      type:   log.device_type,
      time:   log.access_time,
      status: log.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getRecentAccess error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getRecentAccess };