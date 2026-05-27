const mongoose = require('mongoose');

const individualPermissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    reason: { type: String, default: 'Irregular/Working Student' },
  },
  { timestamps: true }
);

individualPermissionSchema.index({ user: 1, schedule: 1 });

module.exports = mongoose.model('IndividualPermission', individualPermissionSchema);
