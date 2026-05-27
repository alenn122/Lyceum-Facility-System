const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RfidUser',
      default: null,
    },
    rfid_tag:    { type: String, required: true },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      default: null,
    },
    access_time:  { type: Date, default: Date.now },
    device_type:  { type: String, enum: ['DOOR', 'POWER'], default: null },
    status:       { type: String, enum: ['granted', 'denied'], default: 'denied' },
  },
  { timestamps: true }
);

accessLogSchema.index({ rfid_tag: 1 });
accessLogSchema.index({ room: 1, access_time: -1 });
accessLogSchema.index({ user: 1, access_time: -1 });
accessLogSchema.index({ status: 1, access_time: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);