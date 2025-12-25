const router = require('express').Router();
const WeeklyPlan = require('../models/WeeklyPlan');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');

// ==========================================
// 1. GET FULL WEEKLY PLAN (Critical for Protocols Page)
// ==========================================
router.get('/plan/:userId', async (req, res) => {
    try {
        const plan = await WeeklyPlan.findOne({ userId: req.params.userId, isActive: true });
        
        // If no plan, return empty
        if (!plan) return res.json({ days: [] });

        // Sort days: Monday (index 0) to Sunday (index 6)
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        
        const sortedDays = plan.days.sort((a, b) => {
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        });

        // 🛠 FIX: Explicitly clear exercises if it is a Rest Day
        const sanitizedDays = sortedDays.map(d => {
            const isRestDay = d.isRest || d.focus.toLowerCase().includes('rest');
            if (isRestDay) {
                return { ...d.toObject(), isRest: true, exercises: [] };
            }
            return d;
        });
        
        res.json({ ...plan.toObject(), days: sanitizedDays });
    } catch (err) {
        console.error("Plan Fetch Error:", err);
        res.status(500).json({ error: "Fetch Failed" });
    }
});

// ==========================================
// 2. GET TODAY'S WORKOUT (For Dashboard Widget)
// ==========================================
router.get('/today/:userId', async (req, res) => {
    try {
        const plan = await WeeklyPlan.findOne({ userId: req.params.userId, isActive: true });
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        if (!plan) return res.json({ day: todayName, isRest: true, focus: "No Plan" });

        const todayWorkout = plan.days.find(d => d.day === todayName);

        if (!todayWorkout || todayWorkout.isRest || todayWorkout.focus.toLowerCase().includes('rest')) {
            return res.json({ day: todayName, isRest: true, focus: "Rest Day", exercises: [] });
        }

        res.json(todayWorkout);
    } catch (err) {
        res.status(500).json({ error: "Today Fetch Error" });
    }
});

// ==========================================
// 3. LOG WORKOUT / HISTORY
// ==========================================
router.post('/save', async (req, res) => {
  try {
    const newLog = new WorkoutLog(req.body);
    await newLog.save();
    // Update Stats
    await User.findByIdAndUpdate(req.body.userId, { 
        $inc: { xp: 100, 'stats.workoutsCompleted': 1 },
        lastActive: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId', async (req, res) => {
    try {
      const logs = await WorkoutLog.find({ userId: req.params.userId }).sort({ date: -1 });
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "History Fetch Error" });
    }
});
  
module.exports = router;