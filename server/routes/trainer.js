const router = require('express').Router();
const User = require('../models/User');
const WeeklyPlan = require('../models/WeeklyPlan');
const DietPlan = require('../models/DietPlan');

// ==================================================
// 1. GET MY SQUAD (ASSIGNED CLIENTS)
// ==================================================
router.get('/squad/:trainerId', async (req, res) => {
    try {
        const clients = await User.find({ trainerId: req.params.trainerId })
                                .select('name email goal tier lastActive image');
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: "Squad Link Failed" });
    }
});

// ==================================================
// 2. FETCH CLIENT PROTOCOLS (WORKOUT & DIET)
// ==================================================
router.get('/protocols/:clientId', async (req, res) => {
    try {
        const workout = await WeeklyPlan.findOne({ userId: req.params.clientId, isActive: true });
        const diet = await DietPlan.findOne({ userId: req.params.clientId, isActive: true });
        const client = await User.findById(req.params.clientId).select('name goal');
        
        res.json({ client, workout, diet });
    } catch (err) {
        res.status(500).json({ error: "Protocol Fetch Failed" });
    }
});

// ==================================================
// 3. UPDATE WORKOUT PROTOCOL
// ==================================================
router.put('/update-workout', async (req, res) => {
    try {
        const { planId, days } = req.body;
        await WeeklyPlan.findByIdAndUpdate(planId, { days });
        res.json({ success: true, message: "Workout Protocol Updated" });
    } catch (err) {
        res.status(500).json({ error: "Update Failed" });
    }
});

// ==================================================
// 4. UPDATE DIET PROTOCOL
// ==================================================
router.put('/update-diet', async (req, res) => {
    try {
        const { planId, week } = req.body;
        await DietPlan.findByIdAndUpdate(planId, { week });
        res.json({ success: true, message: "Ration Plan Updated" });
    } catch (err) {
        res.status(500).json({ error: "Update Failed" });
    }
});

module.exports = router;