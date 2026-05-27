/**
 * seedFromSQL.js — run standalone: node seedFromSQL.js
 * Has its OWN DB connection, does NOT go through index.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const RfidUser      = require('./models/RfidUser');
const Classroom     = require('./models/Classroom');
const Subject       = require('./models/Subject');
const CourseSection = require('./models/CourseSection');
const Schedule      = require('./models/Schedule');
const Device        = require('./models/Device');
const AccessPolicy  = require('./models/AccessPolicy');
const SystemSetting = require('./models/SystemSetting');
const RfidReader    = require('./models/RfidReader');
const AccessLog     = require('./models/AccessLog');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI not found in .env'); process.exit(1); }

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ Connected to MongoDB Atlas\n');

  await Promise.all([
    RfidUser.deleteMany(),     Classroom.deleteMany(),
    Subject.deleteMany(),      CourseSection.deleteMany(),
    Schedule.deleteMany(),     Device.deleteMany(),
    AccessPolicy.deleteMany(), SystemSetting.deleteMany(),
    RfidReader.deleteMany(),   AccessLog.deleteMany(),
  ]);
  console.log('✔ Cleared existing collections\n');

  // 1. Course Sections
  const sections = await CourseSection.insertMany([
    { name: 'BSIT 1-11' }, { name: 'BSCS 1-21' }, { name: 'BSIT 2-11' },
    { name: 'BSCS 2-11' }, { name: 'BSCS-2A'   }, { name: 'BSIT 1-21' },
    { name: 'BSIT 1-31' }, { name: 'BSIT 3-11'  }, { name: 'BSIT 3-21' },
    { name: 'BSIT 4-11' }, { name: 'BSIT-1B'    }, { name: 'BSIS 1-31' },
    { name: 'BSOA 1-11' }, { name: 'BSOA 1-21'  }, { name: 'BSOA 1-31' },
    { name: 'BSOA 1-41' },
  ]);
  const sec = {};
  sections.forEach(s => sec[s.name] = s._id);
  console.log('✔ CourseSection seeded');

  // 2. Classrooms
  const rooms = await Classroom.insertMany([
    { room_code: 'ROOM101', classroom_type: 'CLASSROOM', capacity: 50, floor: '2ND Floor', grace_period: 0, allow_extension: false, double_tap_exit: false },
    { room_code: 'ROOM102', classroom_type: 'CLASSROOM', capacity: 30, floor: '1st Floor', grace_period: 1, allow_extension: false, double_tap_exit: false },
  ]);
  const room = {};
  rooms.forEach(r => room[r.room_code] = r._id);
  console.log('✔ Classrooms seeded');

  // 3. Subjects
  const subjects = await Subject.insertMany([
    { code: 'IT101',   description: 'Introduction to Information Technology' },
    { code: 'ITP311',  description: 'Human Computer Interaction' },
    { code: 'GE304',   description: 'Science Technology Engineering' },
    { code: 'OAC310',  description: 'Business Law' },
    { code: 'OAE301',  description: 'Human Anatomy and Physiology' },
    { code: 'GEE303',  description: 'GE Elective 3- Business Logic' },
    { code: 'OAC309',  description: 'Customer Relations' },
    { code: 'IT202',   description: 'Integrative Programming' },
    { code: 'ENGL101', description: 'English Composition' },
    { code: 'IT311',   description: 'Integrative Programming' },
    { code: 'CS202',   description: 'Data Structures' },
    { code: 'NET101',  description: 'Networking 1' },
    { code: 'IT412',   description: 'Capstone Project 1' },
    { code: 'SYS101',  description: 'System Admin' },
    { code: 'HUM102',  description: 'Ethics' },
  ]);
  const subj = {};
  subjects.forEach(s => subj[s.code] = s._id);
  console.log('✔ Subjects seeded');

  // 4. RFID Users
  const users = await RfidUser.insertMany([
    { rfid_tag: '9DEDD106',     first_name: 'Jonathan',   last_name: 'Mina',     role: 'Admin',    status: 'Active'  },
    { rfid_tag: '42193D05',     first_name: 'Rey Vergel', last_name: 'Abella',   role: 'Faculty',  status: 'Active', archived_date: new Date('2026-04-11') },
    { rfid_tag: '61DE6A05',     first_name: 'Kristel',    last_name: 'Ladot',    role: 'Student',  status: 'Active', course_section: sec['BSIT 1-11'] },
    { rfid_tag: '435345534',    first_name: 'BRO',         last_name: 'DY',      role: 'Cleaning', status: 'Active'  },
    { rfid_tag: '986674',       first_name: 'SIR',         last_name: 'CHIEF',   role: 'Security', status: 'Active'  },
    { rfid_tag: 'RFID002',      first_name: 'Jane',        last_name: 'Smith',   role: 'Faculty',  status: 'Active'  },
    { rfid_tag: 'RFID003',      first_name: 'Mike',        last_name: 'Johnson', role: 'Cleaning', status: 'Active'  },
    { rfid_tag: 'RFID004',      first_name: 'Sarah',       last_name: 'Williams',role: 'Security', status: 'Active'  },
    { rfid_tag: 'RFID005',      first_name: 'Admin',       last_name: 'User',    role: 'Admin',    status: 'Active'  },
    { rfid_tag: 'RFID45345002', first_name: 'John',        last_name: 'Rey',     role: 'Faculty',  status: 'Active'  },
    { rfid_tag: 'RFID076503',   first_name: 'Gio',         last_name: 'Rge',     role: 'Cleaning', status: 'Active'  },
    { rfid_tag: '32446565',     first_name: 'Eya',         last_name: 'Mi',      role: 'Student',  status: 'Active', course_section: sec['BSOA 1-21'] },
    { rfid_tag: '2A914205',     first_name: 'Unknown',     last_name: 'User',    role: 'Student',  status: 'Active'  },
    { rfid_tag: '51EACD17',     first_name: 'Unknown',     last_name: 'User2',   role: 'Student',  status: 'Active'  },
    { rfid_tag: '82041001',     first_name: 'Unknown',     last_name: 'User3',   role: 'Admin',    status: 'Active'  },
  ]);
  const usr = {};
  users.forEach(u => usr[u.rfid_tag] = u._id);
  console.log('✔ RfidUsers seeded');

  // 5. Schedules
  const schedules = await Schedule.insertMany([
    {
      subject: subj['ENGL101'], room: room['ROOM101'], faculty: usr['42193D05'],
      day: 'Fri', start_time: '10:19', end_time: '23:19', is_deleted: true,
      allowed_sections: [sec['BSCS 2-11'], sec['BSIT 1-11']],
    },
    {
      subject: subj['GE304'], room: room['ROOM101'], faculty: usr['9DEDD106'],
      day: 'Mon', start_time: '09:00', end_time: '12:00', is_deleted: false,
      allowed_sections: [sec['BSCS 1-21'], sec['BSCS 2-11'], sec['BSIS 1-31']],
    },
  ]);
  const sched = {};
  schedules.forEach((s, i) => sched[i] = s._id);
  console.log('✔ Schedules seeded');

  // 6. Devices
  await Device.insertMany([
    { mac_address: 'D4:E9:F4:65:F5:1C', room: room['ROOM101'], device_type: 'POWER', status: 'Offline' },
    { mac_address: '70:B8:F6:28:30:84', room: room['ROOM101'], device_type: 'DOOR',  status: 'Offline' },
  ]);
  console.log('✔ Devices seeded');

  // 7. Access Policies
  await AccessPolicy.insertMany([
    { role: 'Admin',   device_type: '*',     requires_schedule: false, can_override_shutdown: true  },
    { role: 'Faculty', device_type: 'POWER', requires_schedule: true,  can_override_shutdown: true  },
    { role: 'Student', device_type: 'DOOR',  requires_schedule: true,  can_override_shutdown: false },
  ]);
  console.log('✔ AccessPolicies seeded');

  // 8. System Settings
  await SystemSetting.insertMany([
    { key: 'global_allow_extension', value: '0' },
    { key: 'global_double_tap',      value: '0' },
    { key: 'global_grace_period',    value: '1' },
  ]);
  console.log('✔ SystemSettings seeded');

  // 9. RFID Readers
  await RfidReader.insertMany([
    { room: room['ROOM101'], port_name: 'COM5',  status: 'Active' },
    { room: room['ROOM102'], port_name: 'COM10', status: 'Active' },
  ]);
  console.log('✔ RfidReaders seeded');

  // 10. Access Logs
  await AccessLog.insertMany([
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Exit',  device_type: 'DOOR',  status: 'denied',  access_time: new Date('2026-04-10T13:19:03') },
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Entry', device_type: 'DOOR',  status: 'denied',  access_time: new Date('2026-04-10T13:18:58') },
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Entry', device_type: 'DOOR',  status: 'denied',  access_time: new Date('2026-04-10T13:18:55') },
    { rfid_tag: '61DE6A05', user: usr['61DE6A05'], room: room['ROOM101'], access_type: 'Entry', device_type: 'DOOR',  status: 'granted', access_time: new Date('2026-04-10T13:18:47'), schedule: sched[0] },
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Entry', device_type: 'POWER', status: 'granted', access_time: new Date('2026-04-10T13:18:26'), schedule: sched[0] },
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Exit',  device_type: 'POWER', status: 'granted', access_time: new Date('2026-04-10T13:18:23'), schedule: sched[0] },
    { rfid_tag: '42193D05', user: usr['42193D05'], room: room['ROOM101'], access_type: 'Exit',  device_type: 'DOOR',  status: 'denied',  access_time: new Date('2026-04-10T13:18:20') },
    { rfid_tag: '9DEDD106', user: usr['9DEDD106'], room: room['ROOM101'], access_type: 'Entry', device_type: 'DOOR',  status: 'granted', access_time: new Date('2026-04-10T13:16:05') },
    { rfid_tag: '61DE6A05', user: usr['61DE6A05'], room: room['ROOM101'], access_type: 'Exit',  device_type: 'DOOR',  status: 'denied',  access_time: new Date('2026-04-10T13:02:25') },
    { rfid_tag: '51EACD17', user: usr['51EACD17'], room: room['ROOM101'], access_type: 'Entry', device_type: 'POWER', status: 'denied',  access_time: new Date('2026-03-27T21:51:25') },
  ]);
  console.log('✔ AccessLogs seeded');

  console.log('\n🎉 All collections seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});