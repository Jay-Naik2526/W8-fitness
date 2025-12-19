const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ytsr = require('yt-search'); // <--- The magic tool
require('dotenv').config();

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const workoutRoutes = require('./routes/workouts');
const fuelRoutes = require('./routes/fuel');
const adminRoutes = require('./routes/admin');
const trainerRoutes = require('./routes/trainer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================================================
// 🎥 VIDEO SEARCH (The MuscleWiki Fix)
// ==================================================
app.get('/api/proxy/video', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).send("No query");

    // We search specifically for MuscleWiki content first
    // Example: "Barbell Squat MuscleWiki"
    const searchTerm = `${query} exercise form musclewiki`;

    console.log(`>> SEARCHING YOUTUBE: ${searchTerm}`);

    const results = await ytsr(searchTerm);

    // Get the first video result
    const video = results.videos.length > 0 ? results.videos[0] : null;

    if (video) {
      console.log(`   ✅ FOUND: ${video.title} (${video.videoId})`);
      res.json({
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        url: video.url
      });
    } else {
      console.log("   ❌ NO VIDEO FOUND");
      res.status(404).json({ error: "Video not found" });
    }

  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(">> W8 SYSTEM: DATABASE CONNECTED"))
  .catch((err) => console.error(">> SYSTEM ERROR: DB CONNECTION FAILED", err));

app.get('/ping', (req, res) => {
  res.status(200).send('SERVER ACTIVE');
});

app.listen(PORT, () => {
  console.log(`>> W8 SERVER RUNNING ON PORT: ${PORT}`);
});