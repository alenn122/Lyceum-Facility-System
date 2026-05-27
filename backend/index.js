const express   = require('express');
const dotenv    = require('dotenv');
const cors      = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/dashboard',   require('./routes/dashboardRoutes'));
app.use('/api/users',       require('./routes/usersRoutes'));
app.use('/api/rooms',       require('./routes/roomsRoutes'));
app.use('/api/schedule',    require('./routes/scheduleRoutes'));
app.use('/api/access-logs', require('./routes/accessLogsRoutes'));
app.use('/api/devices',     require('./routes/devicesRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Lyceum Facility API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
