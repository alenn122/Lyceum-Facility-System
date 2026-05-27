const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
