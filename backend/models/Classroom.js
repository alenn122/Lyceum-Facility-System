const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    room_code:      { type: String, required: true, unique: true, trim: true },
    status:         { type: String, enum: ['Occupied', 'Unoccupied'], default: 'Unoccupied' },
    classroom_type: { type: String, default: null },
    capacity:       { type: Number, default: null },
    floor:          { type: String, required: true },
    grace_period:   { type: Number, default: 15 },        // minutes
    allow_extension:  { type: Boolean, default: true },
    double_tap_exit:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

classroomSchema.index({ room_code: 1 });
classroomSchema.index({ status: 1 });

module.exports = mongoose.model('Classroom', classroomSchema);
