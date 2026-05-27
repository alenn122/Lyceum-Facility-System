const mongoose = require('mongoose');

// This is the "users" table from your PHP — students, faculty, cleaning, security
const rfidUserSchema = new mongoose.Schema({
  rfid_tag:       { type: String, required: true, unique: true, trim: true },
  first_name:     { type: String, required: true, trim: true },
  last_name:      { type: String, required: true, trim: true },
  role:           { type: String, enum: ['Student','Faculty','Admin','Cleaning','Security'], required: true },
  status:         { type: String, enum: ['Active','Inactive','Archived'], default: 'Active' },
  course_section: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseSection', default: null },
  archived_date:  { type: Date, default: null },
}, { timestamps: true });

rfidUserSchema.index({ rfid_tag: 1 });

module.exports = mongoose.model('RfidUser', rfidUserSchema);