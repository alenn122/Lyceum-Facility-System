const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin',
    password: hashedPassword,
    role: 'admin'
  });
  console.log('Admin user created! ✅');
  process.exit();
}).catch(err => console.log(err));