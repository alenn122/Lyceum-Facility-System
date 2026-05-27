const mongoose = require('mongoose');

const rfidReaderSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    port_name:  { type: String, required: true },
    status:     { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    last_online: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RfidReader', rfidReaderSchema);
