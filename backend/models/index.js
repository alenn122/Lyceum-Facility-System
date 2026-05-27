// Central export — import everything from here
const User                = require('./User');
const Classroom           = require('./Classroom');
const Subject             = require('./Subject');
const CourseSection       = require('./CourseSection');
const Schedule            = require('./Schedule');
const AccessLog           = require('./AccessLog');
const Device              = require('./Device');
const IndividualPermission = require('./IndividualPermission');
const AccessPolicy        = require('./AccessPolicy');
const SystemSetting       = require('./SystemSetting');
const RfidReader          = require('./RfidReader');
const RfidBuffer          = require('./RfidBuffer');
const LastScan            = require('./LastScan');

module.exports = {
  User,
  Classroom,
  Subject,
  CourseSection,
  Schedule,
  AccessLog,
  Device,
  IndividualPermission,
  AccessPolicy,
  SystemSetting,
  RfidReader,
  RfidBuffer,
  LastScan,
};
