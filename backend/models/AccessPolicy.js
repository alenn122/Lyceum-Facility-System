const mongoose = require('mongoose');

const accessPolicySchema = new mongoose.Schema(
  {
    role:                  { type: String, required: true },
    device_type:           { type: String, default: '*' },  // '*' = all
    requires_schedule:     { type: Boolean, default: false },
    can_override_shutdown: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accessPolicySchema.index({ role: 1, device_type: 1 }, { unique: true });

module.exports = mongoose.model('AccessPolicy', accessPolicySchema);
