const mongoose = require('mongoose');

const rfidBufferSchema = new mongoose.Schema(
  {
    rfid_tag:   { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: 300 }, // TTL: auto-delete after 5 min
  }
);

module.exports = mongoose.model('RfidBuffer', rfidBufferSchema);
