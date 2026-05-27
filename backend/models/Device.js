const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  mac_address:  { type: String, required: true, unique: true, trim: true },
  room:         { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  device_type:  { type: String, enum: ['DOOR', 'POWER'], default: 'DOOR' },
  last_seen:    { type: Date, default: null },
  status:       { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
  is_archived:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);