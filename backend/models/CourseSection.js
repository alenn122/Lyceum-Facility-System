const mongoose = require('mongoose');

const courseSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseSection', courseSectionSchema);
