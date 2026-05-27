const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.deleteMany({});
  console.log('All users deleted! ✅');
  process.exit();
}).catch(err => console.log(err));