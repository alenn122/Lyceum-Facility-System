const Schedule      = require('../models/Schedule');
const Subject       = require('../models/Subject');
const RfidUser      = require('../models/RfidUser');
const Classroom     = require('../models/Classroom');
const CourseSection = require('../models/CourseSection');

// GET /api/schedule
const getSchedules = async (req, res) => {
  try {
    const { day, room, faculty } = req.query;
    const filter = { is_deleted: false };
    if (day)     filter.day     = day;
    if (room)    filter.room    = room;
    if (faculty) filter.faculty = faculty;

    const schedules = await Schedule.find(filter)
      .populate('subject', 'code description')
      .populate('room',    'room_code floor')
      .populate('faculty', 'first_name last_name')
      .populate('allowed_sections', 'name')
      .sort({ day: 1, start_time: 1 });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schedule/archived
const getArchivedSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ is_deleted: true })
      .populate('subject', 'code description')
      .populate('room',    'room_code floor')
      .populate('faculty', 'first_name last_name')
      .populate('allowed_sections', 'name')
      .sort({ updatedAt: -1 });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schedule/:id
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('subject', 'code description')
      .populate('room',    'room_code floor')
      .populate('faculty', 'first_name last_name')
      .populate('allowed_sections', 'name');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/schedule
const createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/schedule/:id
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/schedule/:id  (soft delete)
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id, { is_deleted: true }, { new: true }
    );
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule archived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/schedule/:id/restore
const restoreSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id, { is_deleted: false }, { new: true }
    );
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule restored' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schedule/subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ code: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/schedule/bulk-import
const bulkImport = async (req, res) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ message: 'No data provided' });

    let success = 0, failed = 0;
    const errors = [];

    for (const [i, row] of rows.entries()) {
      const rowNum = i + 2;
      try {
        // Resolve subject by code
        const subject = await Subject.findOne({ code: String(row.code || '').trim() });
        if (!subject) { errors.push(`Row ${rowNum}: Subject code "${row.code}" not found`); failed++; continue; }

        // Resolve room by code
        const room = await Classroom.findOne({ room_code: String(row.room_code || '').trim() });
        if (!room) { errors.push(`Row ${rowNum}: Room "${row.room_code}" not found`); failed++; continue; }

        // Resolve faculty by full name
        const nameParts = String(row.faculty_name || '').trim().split(' ');
        const faculty = await RfidUser.findOne({
          first_name: { $regex: nameParts[0], $options: 'i' },
          last_name:  { $regex: nameParts[nameParts.length - 1], $options: 'i' },
          role: 'Faculty',
        });
        if (!faculty) { errors.push(`Row ${rowNum}: Faculty "${row.faculty_name}" not found`); failed++; continue; }

        // Resolve sections (comma-separated)
        const sectionNames = String(row.course_section || '').split(',').map(s => s.trim()).filter(Boolean);
        const sectionDocs  = await CourseSection.find({ name: { $in: sectionNames } });
        if (sectionDocs.length === 0) { errors.push(`Row ${rowNum}: No valid sections found for "${row.course_section}"`); failed++; continue; }

        const validDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const day = String(row.day || '').trim();
        if (!validDays.includes(day)) { errors.push(`Row ${rowNum}: Invalid day "${day}"`); failed++; continue; }

        await Schedule.create({
          subject:          subject._id,
          room:             room._id,
          faculty:          faculty._id,
          day,
          start_time:       String(row.start_time || '').trim(),
          end_time:         String(row.end_time   || '').trim(),
          allowed_sections: sectionDocs.map(s => s._id),
        });
        success++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
        failed++;
      }
    }

    res.json({ success, failed, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSchedules, getArchivedSchedules, getScheduleById,
  createSchedule, updateSchedule, deleteSchedule, restoreSchedule,
  getSubjects, bulkImport,
};