const router = require('express').Router();
const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WorkoutLog = require('../models/WorkoutLog');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');

// ==========================================
// 1. REGISTER (USING PHONE)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    // 👇 Get Phone instead of Email
    const { name, phone, password } = req.body;

    const userExists = await User.findOne({ phone });
    if (userExists) return res.status(400).json({ msg: "Phone number already registered." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      phone, // <--- Save Phone
      password: hashedPassword,
      role: 'client',      
      status: 'pending'    
    });
    
    await newUser.save();
    res.json({ msg: "Registration successful. Awaiting Admin Approval." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. LOGIN (USING PHONE)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    // 👇 Get Phone instead of Email
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: "User does not exist." });

    // --- MASTER OVERRIDE START ---
    // 👇 CHANGED: Check for specific "Admin Phone" (Example: 10 Zeros)
    // You can use this phone number to log in as admin immediately.
    if (phone === '0000000000') {
        if (user.role !== 'admin' || user.status !== 'active') {
            user.role = 'admin';
            user.status = 'active';
            await user.save();
            console.log("⚠️ MASTER ADMIN AUTO-RESTORED ⚠️");
        }
    } 
    // --- MASTER OVERRIDE END ---

    // NORMAL USER CHECK: Block if Pending
    else if (user.status === 'pending') {
        return res.status(403).json({ msg: "ACCESS DENIED: ACCOUNT PENDING APPROVAL" });
    }

    // Validate Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials." });

    // Issue Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'w8_secret_key', { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone, // <--- Send back Phone
        email: user.email,
        tier: user.tier,
        role: user.role,
        status: user.status,
        stats: user.stats
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ADMIN: CREATE TRAINER (Direct & Active)
// ==========================================
router.post('/create-trainer', async (req, res) => {
    try {
        // 👇 Trainer creation now also needs a Phone
        const { name, phone, email, password, tier } = req.body;

        const userExists = await User.findOne({ phone });
        if (userExists) return res.status(400).json({ msg: "Phone already taken" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newTrainer = new User({
            name,
            phone,  // <--- Required
            email: email || "", // Optional
            password: hashedPassword,
            role: 'trainer',
            status: 'active', 
            tier: tier || 'ELITE'
        });

        await newTrainer.save();
        res.json({ success: true, msg: "Officer Deployed" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. ADMIN: APPROVE USER (Unlock Pending)
// ==========================================
router.put('/approve-user/:id', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { status: 'active' });
        res.json({ success: true, msg: "Operative Approved" });
    } catch (err) {
        res.status(500).json({ error: "Approval Failed" });
    }
});

// ==========================================
// 5. GET ACTIVE DIET PLAN
// ==========================================
router.get('/my-diet/:userId', async (req, res) => {
    try {
        const diet = await DietPlan.findOne({ userId: req.params.userId, isActive: true });
        res.json(diet || null);
    } catch (err) { res.status(500).json({ error: "Failed to fetch diet" }); }
});

// ==========================================
// 6. UPDATE USER STATS
// ==========================================
router.put('/update-stats', async (req, res) => {
  try {
    const { userId, bench, squat, deadlift } = req.body;
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: { "stats.bench": bench, "stats.squat": squat, "stats.deadlift": deadlift } }, { new: true });
    res.json(updatedUser);
  } catch (err) { res.status(500).json({ error: "Server failed to update stats" }); }
});

// ==========================================
// 7. GET DASHBOARD STATS
// ==========================================
router.get('/stats/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Quick Calc for Calories/XP
    const logs = await WorkoutLog.find({ userId });
    let totalMinutes = 0;
    logs.forEach(log => totalMinutes += (log.duration || 45));
    
    const today = new Date().toDateString(); 
    const lastActiveDate = user.lastActive ? new Date(user.lastActive).toDateString() : null;

    res.json({
      name: user.name,
      tier: user.tier,
      streak: user.streak || 0,
      calories: totalMinutes * 8,
      xp: user.xp || 0,
      id: user._id,
      checkedInToday: today === lastActiveDate
    });
  } catch (err) { res.status(500).json({ error: "Stats Failed" }); }
});

// ==========================================
// 8. THE BEACON (CHECK-IN)
// ==========================================
router.post('/checkin', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toDateString();
    const lastActive = user.lastActive ? new Date(user.lastActive).toDateString() : null;

    if (lastActive === today) return res.status(400).json({ error: "Already deployed today." });

    user.streak += 1;
    user.lastActive = new Date();
    await user.save();
    res.json({ success: true, streak: user.streak, msg: "DEPLOYMENT CONFIRMED" });
  } catch (err) { res.status(500).json({ error: "Check-in System Failure" }); }
});

// ==========================================
// 9. PUBLIC DATA
// ==========================================
router.get('/public-trainers', async (req, res) => {
  try {
      const trainers = await User.find({ role: 'trainer' }).select('name image goal tier bio gender'); 
      res.json(trainers);
  } catch (err) { res.status(500).json({ error: "Public Intel Failed" }); }
});

router.get('/public-plans', async (req, res) => {
  try {
      const plans = await Plan.find().sort({ order: 1 });
      res.json(plans);
  } catch (err) { res.status(500).json({ error: "Pricing Offline" }); }
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================
router.get('/notifications/:userId', async (req, res) => {
  try {
      const notes = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(10);
      res.json(notes);
  } catch (err) { res.status(500).json({ error: "Comms Offline" }); }
});

router.put('/notifications/read/:id', async (req, res) => {
  try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
      res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Update Failed" }); }
});

module.exports = router;