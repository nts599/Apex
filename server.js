// server.js
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. DATABASE CONNECTION (SQLite for local demo)
// ==========================================
// !!! NOTE FOR ORACLE !!!
// To switch to Oracle, install 'npm install oracledb' and change the following lines:
// const sequelize = new Sequelize('XE', 'username', 'password', {
//   host: 'localhost',
//   dialect: 'oracle'
// });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './apex_database.sqlite',
  logging: false,
});

// ==========================================
// 2. DEFINE MODELS (Schema & Foreign Keys)
// ==========================================
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  avatar_url: { type: DataTypes.STRING, defaultValue: 'avatar.png' },
});

const App = sequelize.define('App', {
  app_name: { type: DataTypes.STRING, allowNull: false },
  icon_url: { type: DataTypes.STRING },
  daily_usage_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Session = sequelize.define('Session', {
  subject: { type: DataTypes.STRING, allowNull: false },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
  session_date: { type: DataTypes.STRING, allowNull: false },
  focus_score: { type: DataTypes.INTEGER, allowNull: false },
});

// Foreign Key Relationships
User.hasMany(Session, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

// ==========================================
// 3. SEED DATA (15+ Realistic Records)
// ==========================================
async function seedDatabase() {
  const userCount = await User.count();
  if (userCount > 0) return; // Don't reseed if data exists

  console.log('🌱 Seeding database with 15+ realistic records...');

  const user = await User.create({
    name: 'Alex Sterling',
    email: 'alex@example.com',
    avatar_url: 'avatar.png'
  });

  // 9 Apps
  const apps = [
    { app_name: 'Instagram', icon_url: 'instagram.png', daily_usage_minutes: 72, is_blocked: true },
    { app_name: 'Twitter', icon_url: 'twitter.png', daily_usage_minutes: 45, is_blocked: true },
    { app_name: 'YouTube', icon_url: 'youtube.png', daily_usage_minutes: 140, is_blocked: false },
    { app_name: 'TikTok', icon_url: 'tiktok.png', daily_usage_minutes: 120, is_blocked: false },
    { app_name: 'Snapchat', icon_url: 'snapchat.png', daily_usage_minutes: 20, is_blocked: false },
    { app_name: 'Reddit', icon_url: 'reddit.png', daily_usage_minutes: 35, is_blocked: true },
    { app_name: 'WhatsApp', icon_url: 'whatsapp.png', daily_usage_minutes: 90, is_blocked: false },
    { app_name: 'Spotify', icon_url: 'spotify.png', daily_usage_minutes: 15, is_blocked: false },
    { app_name: 'Netflix', icon_url: 'netflix.png', daily_usage_minutes: 180, is_blocked: false },
  ];
  await App.bulkCreate(apps);

  // 6 Sessions (Total 15+ records when combined with apps & user)
  const sessions = [
    { subject: 'JavaScript Algorithms', duration_minutes: 65, session_date: '2026-10-14', focus_score: 88, user_id: user.id },
    { subject: 'Database Design Exam Prep', duration_minutes: 120, session_date: '2026-10-15', focus_score: 92, user_id: user.id },
    { subject: 'Data Structures Review', duration_minutes: 45, session_date: '2026-10-16', focus_score: 75, user_id: user.id },
    { subject: 'Frontend Frameworks Study', duration_minutes: 90, session_date: '2026-10-17', focus_score: 85, user_id: user.id },
    { subject: 'System Architecture', duration_minutes: 110, session_date: '2026-10-18', focus_score: 95, user_id: user.id },
    { subject: 'Mobile App Development', duration_minutes: 60, session_date: '2026-10-19', focus_score: 78, user_id: user.id },
  ];
  await Session.bulkCreate(sessions);
  console.log('✅ Database seeded successfully!');
}

// ==========================================
// 4. CRUD API ENDPOINTS
// ==========================================
// GET: Fetch all Apps for Blocker page
app.get('/api/apps', async (req, res) => {
  try {
    const apps = await App.findAll();
    res.json(apps);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch apps' }); }
});

// PUT: Toggle Block status
app.put('/api/apps/:id', async (req, res) => {
  try {
    const app = await App.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found' });
    app.is_blocked = !app.is_blocked;
    await app.save();
    res.json(app);
  } catch (err) { res.status(500).json({ error: 'Failed to update app' }); }
});

// GET: Fetch User Profile
app.get('/api/user', async (req, res) => {
  try {
    const user = await User.findOne();
    res.json(user);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

// PUT: Update User Profile
app.put('/api/user', async (req, res) => {
  try {
    const user = await User.findOne();
    await user.update(req.body);
    res.json(user);
  } catch (err) { res.status(500).json({ error: 'Failed to update profile' }); }
});

// GET: Fetch Sessions for Reports
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.findAll();
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch sessions' }); }
});

// POST: Create New Session
app.post('/api/sessions', async (req, res) => {
  try {
    const { subject, duration_minutes, session_date, focus_score } = req.body;
    const user = await User.findOne();
    const newSession = await Session.create({
      subject, duration_minutes, session_date, focus_score, user_id: user.id
    });
    res.status(201).json(newSession);
  } catch (err) { res.status(500).json({ error: 'Failed to create session' }); }
});

// DELETE: Delete a session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await session.destroy();
    res.json({ message: 'Session deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete session' }); }
});

// ==========================================
// 5. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

async function startServer() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Set force:false after first run to keep data
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => console.error('❌ Failed to start server:', err));
