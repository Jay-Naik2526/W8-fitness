const router = require('express').Router();
const User = require('../models/User');
const WeeklyPlan = require('../models/WeeklyPlan');
const DietPlan = require('../models/DietPlan');
const bcrypt = require('bcryptjs');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');

// ==================================================
// 1. ADMIN DASHBOARD STATS
// ==================================================
router.get('/stats', async (req, res) => {
    try {
        const totalClients = await User.countDocuments({ role: 'client' });
        const totalTrainers = await User.countDocuments({ role: 'trainer' });
        const ptClients = await User.countDocuments({ role: 'client', trainerId: { $ne: null } });
        const genClients = totalClients - ptClients;

        res.json({
            totalClients,
            totalTrainers,
            ptClients,
            genClients,
            revenue: (ptClients * 150) + (genClients * 50) // $150 for PT, $50 for AI
        });
    } catch (err) {
        res.status(500).json({ error: "Admin Intel Failed" });
    }
});

// ==================================================
// 2. GET CLIENT ROSTER (With Filters)
// ==================================================
router.get('/clients', async (req, res) => {
    try {
        // FIXED: Added 'phone' to select list
        const clients = await User.find({ role: 'client' })
                                .select('name phone email tier goal trainerId lastActive status') 
                                .populate('trainerId', 'name')
                                .sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: "Roster Fetch Failed" });
    }
});

// ==================================================
// 3. GET TRAINER ROSTER (With Client Counts)
// ==================================================
router.get('/trainers', async (req, res) => {
    try {
        // FIXED: Added 'phone' to select list
        const trainers = await User.find({ role: 'trainer' }).select('name phone email specialization tier image goal bio gender');
        
        // Count clients for each trainer
        const trainerData = await Promise.all(trainers.map(async (t) => {
            const clientCount = await User.countDocuments({ trainerId: t._id });
            return { ...t.toObject(), clientCount };
        }));

        res.json(trainerData);
    } catch (err) {
        res.status(500).json({ error: "Trainer Fetch Failed" });
    }
});

// ==================================================
// 4. ASSIGN / REVOKE TRAINER
// ==================================================
router.put('/assign', async (req, res) => {
    try {
        const { clientId, trainerId } = req.body;
        // If "REMOVE", set to null
        const updateVal = (trainerId === "REMOVE" || !trainerId) ? null : trainerId;
        await User.findByIdAndUpdate(clientId, { trainerId: updateVal });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Assignment Failed" });
    }
});

// ==================================================
// 5. INSPECT CLIENT (FETCHES DIET & WORKOUT)
// ==================================================
router.get('/inspect/:userId', async (req, res) => {
    try {
        const workout = await WeeklyPlan.findOne({ userId: req.params.userId, isActive: true });
        const diet = await DietPlan.findOne({ userId: req.params.userId, isActive: true });
        res.json({ workout, diet }); 
    } catch (err) { res.status(500).json({ error: "Inspection Failed" }); }
});

// ==================================================
// 6. GET TRAINER'S SQUAD
// ==================================================
router.get('/squad/:trainerId', async (req, res) => {
    try {
        // FIXED: Added 'phone' to select list
        const squad = await User.find({ trainerId: req.params.trainerId })
                              .select('name phone email goal tier lastActive');
        res.json(squad);
    } catch (err) { res.status(500).json({ error: "Squad Lookup Failed" }); }
});

// ==================================================
// 7. SEED REAL TEAM (OFFICIAL ROSTER UPDATE)
// ==================================================
router.post('/seed-trainers', async (req, res) => {
    try {
        // 1. Wipe existing trainers to avoid duplicates
        await User.deleteMany({ role: 'trainer' });

        const commonPassword = await bcrypt.hash("w8fitness", 10);

        // FIXED: Added 'phone' field to all seed data (Required by new Schema)
        const roster = [
            // ===========================================
            // MALE DIVISION
            // ===========================================
            
            // --- COMMANDERS (15+ Years) ---
            {
                name: "Ajay Kahar",
                phone: "9800000001",
                email: "ajay@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "COMMANDER",
                goal: "STRENGTH",
                image: "", 
                bio: "20 Years Active Duty • 150+ Transformations. A veteran of the iron game, specializing in foundational strength and drastic body recomposition. His methods are old-school, proven, and non-negotiable."
            },
            {
                name: "Shakir Madari",
                phone: "9800000002",
                email: "shakir@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "COMMANDER",
                goal: "HYPERTROPHY",
                bio: "15 Years Exp • 200+ Clients Transformed. The Master of Weight Loss. Shakir re-engineers metabolisms and sculpts physiques with surgical precision. If you want results, you follow his protocol."
            },

            // --- ELITE (10+ Years) ---
            {
                name: "Bhavesh Goswami",
                phone: "9800000003",
                email: "bhavesh@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "ELITE",
                goal: "HYPERTROPHY",
                bio: "10 Years Exp • 150+ Success Stories. A tactical specialist in aesthetic bodybuilding and fat loss. Bhavesh combines high-volume training with strict discipline to carve elite physiques."
            },

            // --- OPERATIVES (Mid-Level Experts) ---
            {
                name: "Ronak",
                phone: "9800000004",
                email: "ronak@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "OPERATIVE",
                goal: "ENDURANCE",
                bio: "5 Years Exp • Lifestyle Architect. Focused on sustainable habit formation and long-term health optimization. He bridges the gap between gym performance and daily life."
            },
            {
                name: "Kamal Prajapati",
                phone: "9800000005",
                email: "kamal@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "OPERATIVE",
                goal: "ENDURANCE",
                bio: "5 Years Exp • Lifestyle Strategy. Specializes in correcting metabolic dysfunction and building functional endurance for the modern world."
            },
            {
                name: "Salman",
                phone: "9800000006",
                email: "salman@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "OPERATIVE",
                goal: "STRENGTH",
                bio: "4 Years Exp • CrossFit Specialist. Expert in high-intensity functional movement. He builds engines that don't quit and strength that applies to the real world."
            },
            {
                name: "Vrund Patel",
                phone: "9800000007",
                email: "vrund@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Male",
                tier: "INITIATE",
                goal: "HYPERTROPHY",
                bio: "1 Year Exp • Hypertrophy Specialist. The new wave of bodybuilding. Vrund brings modern, science-based tension techniques to maximize muscle density."
            },

            // ===========================================
            // FEMALE UNIT
            // ===========================================
            {
                name: "Mayuri Mistry",
                phone: "9800000008",
                email: "mayuri@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Female",
                tier: "ELITE",
                goal: "ENDURANCE",
                bio: "6 Years Exp • Combat & Cardio Specialist. Master of Kickboxing and female-specific strength conditioning. She forges agility, power, and lean muscle."
            },
            {
                name: "Hetal Sumara",
                phone: "9800000009",
                email: "hetal@w8.com",
                password: commonPassword,
                role: "trainer",
                gender: "Female",
                tier: "OPERATIVE",
                goal: "STRENGTH",
                bio: "4 Years Exp • CrossFit Tactician. Specializes in metabolic conditioning and functional power. She pushes the anaerobic threshold to the limit."
            }
        ];

        await User.insertMany(roster);
        res.json({ success: true, message: "Official Roster Deployed: 9 Agents Active." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Roster Deployment Failed" });
    }
});

// ==================================================
// 8. ADD NEW TRAINER (RECRUITMENT)
// ==================================================
router.post('/add-trainer', async (req, res) => {
    try {
        // FIXED: Extract 'phone' and 'password' from body
        const { name, phone, email, password, specialization, tier, image, gender, bio } = req.body;
        
        // FIXED: Check validation against PHONE (primary key), not just email
        const existing = await User.findOne({ phone });
        if (existing) return res.status(400).json({ error: "Phone number already active." });

        // FIXED: Use provided password if available, else default
        const passToHash = password || "w8fitness";
        const hashedPassword = await bcrypt.hash(passToHash, 10);
        
        await User.create({
            name,
            phone, // <--- REQUIRED FIELD
            email: email || "", // Optional
            password: hashedPassword,
            role: 'trainer',
            goal: specialization || "General",
            tier: tier || 'ELITE',
            image: image || "",
            gender: gender || 'Male',
            bio: bio || "W8 Certified Trainer"
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err); // Log error for debugging
        res.status(500).json({ error: "Recruitment Failed: " + err.message });
    }
});

// ==================================================
// 9. FIRE TRAINER (DELETE)
// ==================================================
router.delete('/delete-trainer/:id', async (req, res) => {
    try {
        await User.updateMany({ trainerId: req.params.id }, { trainerId: null });
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Termination Failed" });
    }
});

// ==================================================
// 11. MEMBERSHIP CONTROL (GET, ADD, DELETE)
// ==================================================
router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find().sort({ order: 1 });
        res.json(plans);
    } catch (err) { res.status(500).json({ error: "Plan Fetch Error" }); }
});

router.post('/add-plan', async (req, res) => {
    try {
        await Plan.create(req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Creation Failed" }); }
});

router.delete('/delete-plan/:id', async (req, res) => {
    try {
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Deletion Failed" }); }
});

// ==================================================
// 12. SEED PRICING (STRICT UPDATE)
// ==================================================
router.post('/seed-plans', async (req, res) => {
    try {
        await Plan.deleteMany({}); // Clear old plans

        const plans = [
            // --- 1. NORMAL GYM FLOOR ---
            { 
                title: "Gym Floor Monthly", 
                category: "GYM", 
                duration: "1 Month", 
                price: 3000, 
                features: ["Normal Gym Floor Access"], 
                order: 1 
            },
            { 
                title: "Gym Floor Quarterly", 
                category: "GYM", 
                duration: "3 Months", 
                price: 6000, 
                features: ["Normal Gym Floor Access", "Save ₹3000"], 
                highlight: true,
                order: 2 
            },
            { 
                title: "Gym Floor Yearly", 
                category: "GYM", 
                duration: "1 Year", 
                price: 15000, 
                features: ["Normal Gym Floor Access", "Best Value"], 
                order: 3 
            },

            // --- 2. REGULAR PT ---
            { 
                title: "Regular PT", 
                category: "PT", 
                duration: "1 Month", 
                price: 7500, 
                features: ["Personal Trainer", "Gym Floor Access"], 
                order: 4 
            },
            { 
                title: "Regular PT Quarter", 
                category: "PT", 
                duration: "3 Months", 
                price: 21000, 
                features: ["Personal Trainer", "Gym Floor Access", "Long Term Progress"], 
                highlight: true,
                order: 5 
            },

            // --- 3. PRO PT (VIP) ---
            { 
                title: "Pro PT VIP", 
                category: "PRO", 
                duration: "1 Month", 
                price: 8000, 
                features: ["VIP Gym Access", "Exclusive PT Section", "Senior Coach"], 
                highlight: true,
                order: 6 
            },

            // --- 4. PILATES ---
            { 
                title: "Pilates Day Pass", 
                category: "PILATES", 
                duration: "1 Day", 
                price: 500, 
                features: ["Pilates Training Access"], 
                order: 7 
            },
            { 
                title: "Pilates Monthly", 
                category: "PILATES", 
                duration: "1 Month", 
                price: 8000, 
                features: ["24 Sessions", "Pilates Training Access"], 
                order: 8 
            }
        ];

        await Plan.insertMany(plans);
        res.json({ success: true, message: "Pricing Matrix Updated." });
    } catch (err) {
        res.status(500).json({ error: "Seeding Failed" });
    }
});
// ==================================================
// 13. INTEL SYSTEM (SINGLE & BROADCAST)
// ==================================================

// Send to Single Target (Used in Client Roster)
router.post('/notify', async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        await Notification.create({ userId, message, type: type || 'INFO' });
        res.json({ success: true, message: "Intel Transmitted." });
    } catch (err) {
        res.status(500).json({ error: "Transmission Failed" });
    }
});

// Send to ALL Clients (Global Broadcast)
router.post('/notify-all', async (req, res) => {
    try {
        const { message, type } = req.body;
        // Find all clients
        const clients = await User.find({ role: 'client' }).select('_id');
        
        if (clients.length === 0) return res.json({ success: true, message: "No targets found." });

        // Create a notification for each client
        const notifications = clients.map(client => ({
            userId: client._id,
            message,
            type: type || 'ALERT', // Default to ALERT for global messages
            read: false
        }));

        await Notification.insertMany(notifications);
        
        res.json({ success: true, message: `Broadcast sent to ${clients.length} operatives.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Broadcast System Failure" });
    }
});

// ==================================================
// 14. DELETE CLIENT (NEW)
// ==================================================
router.delete('/delete-client/:id', async (req, res) => {
    try {
        // Permanently remove user
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, msg: "Client Removed" });
    } catch (err) {
        res.status(500).json({ error: "Deletion Failed" });
    }
});

module.exports = router;