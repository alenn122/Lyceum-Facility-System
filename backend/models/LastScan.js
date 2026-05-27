const mongoose = require('mongoose');

// Single-document collection — always upsert the singleton
const lastScanSchema = new mongoose.Schema(
  {
    _id:        { type: String, default: 'singleton' },
    uid:        { type: String, default: 'NONE' },
    scanned_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = mongoose.model('LastScan', lastScanSchema);
