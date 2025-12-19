const router = require('express').Router();
const WorkoutLog = require('../models/WorkoutLog');

// SAVE WORKOUT
router.post('/save', async (req, res) => {
  try {
    const newLog = new WorkoutLog(req.body);
    const saved = await newLog.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET HISTORY (Fetch all workouts for a specific user)
router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      // Find logs for this ID, sort by Date (Newest first)
      const logs = await WorkoutLog.find({ userId }).sort({ date: -1 });
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Could not fetch battle logs" });
    }
  });
  
  module.exports = router;