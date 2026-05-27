const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject:          { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',   required: true },
  room:             { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  faculty:          { type: mongoose.Schema.Types.ObjectId, ref: 'RfidUser',  default: null },  // ref fixed to RfidUser
  day:              { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  start_time:       { type: String, required: true },
  end_time:         { type: String, required: true },
  is_deleted:       { type: Boolean, default: false },
  allowed_sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseSection' }],
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);