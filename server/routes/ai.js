const router = require('express').Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const WeeklyPlan = require('../models/WeeklyPlan'); 
const DietPlan = require('../models/DietPlan'); 
const ytsr = require('yt-search'); 
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==================================================
// 1. STRICT MODEL PRIORITY
// ==================================================
const MODEL_PRIORITY = [
  "gemini-flash-latest",       // 1. Primary
  "gemini-2.5-flash-lite",     // 2. Secondary
  "gemini-2.5-pro",            // 3. Smartest
  "gemini-2.0-flash",          // 4. Legacy
  "gemini-2.0-flash-lite"      // 5. Last Resort
];

// Helper: Add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ==================================================
// 2. VIDEO INTELLIGENCE (YouTube Proxy)
// ==================================================
router.get('/proxy/video', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).send("No query");

        const searchTerm = `${query} exercise form musclewiki`;
        
        const results = await ytsr(searchTerm);
        const video = results.videos.length > 0 ? results.videos[0] : null;

        if (video) {
            res.json({ 
                videoId: video.videoId, 
                title: video.title,
                thumbnail: video.thumbnail 
            });
        } else {
            res.status(404).json({ error: "Video not found" });
        }
    } catch (error) {
        console.error("Video Search Error:", error.message);
        res.status(500).json({ error: "Visual Uplink Failed" });
    }
});

// ==================================================
// 3. WEEKLY PLAN GENERATOR (UPDATED FOR NUMERIC WEIGHTS)
// ==================================================
router.post('/generate-weekly', async (req, res) => {
  try {
      const { userId, stats, schedule, inventory } = req.body;
      
      const bench = stats?.bench || 0;
      const squat = stats?.squat || 0;
      const deadlift = stats?.deadlift || 0;
      const goal = stats?.goal || 'General Fitness';
      const startStr = stats?.startDate || new Date().toISOString();

      const lastPlan = await WeeklyPlan.findOne({ userId }).sort({ createdAt: -1 });
      const nextWeekNum = lastPlan ? (lastPlan.weekNumber + 1) : 1;

      await WeeklyPlan.updateMany({ userId, isActive: true }, { isActive: false });

      let scheduleText = "";
      if (schedule && Array.isArray(schedule)) {
          scheduleText = schedule.map(day => 
              `- ${day.label}: Equipment Mode: "${day.equipment}", Duration: ${day.duration} mins`
          ).join("\n");
      } else {
          scheduleText = "- Default: 3 Days Full Body (60 mins)";
      }

      // --- CRITICAL UPDATE: PROMPT FORCING NUMBERS ---
      const prompt = `
        ACT AS: Elite Strength & Conditioning Coach.
        TASK: Generate a Weekly Training Protocol (Week ${nextWeekNum}) strictly adhering to available assets.
        
        OPERATIVE PROFILE (1RM):
        - Bench: ${bench}kg, Squat: ${squat}kg, Deadlift: ${deadlift}kg
        - Goal: ${goal}

        ======= CRITICAL ASSET INVENTORY (STRICT) =======
        ${inventory || "STANDARD GYM"}
        =================================================

        TRAINING SCHEDULE:
        ${scheduleText}

        INSTRUCTIONS:
        1. Generate workouts ONLY for the days listed.
        2. "Full Gym" Days: Use the Machines listed above + Free Weights.
        3. "Dumbbells" Days: ONLY use Dumbbells + Bench. NO MACHINES.
        4. "Bodyweight" Days: Calisthenics only.
        
        5. *** WEIGHT CALCULATION PROTOCOL (CRITICAL) ***:
           - You MUST provide a specific NUMBER (in KG) for the 'weight' field for ALL weighted exercises.
           - DO NOT use text like "Moderate", "Heavy", or "RPE". 
           - **Barbell Lifts:** Use ~70-80% of 1RM stats provided above.
           - **Dumbbell Lifts:** Estimate load based on 1RM (e.g. DB Press = ~30% of Bench 1RM per hand). ROUND to nearest 2.5kg (available increments).
           - **Machines:** Estimate a target weight (e.g. 40, 50, 60) suitable for a "Moderate/Heavy" set.
           - **Bodyweight Moves:** Set 'weight' to 0.

        6. OUTPUT JSON ONLY. Array of objects.

        JSON STRUCTURE:
        [
          {
            "dayName": "Mon",
            "focus": "Upper Body Power",
            "exercises": [
              { "name": "Barbell Bench Press", "sets": "4", "reps": "6-8", "weight": 80, "notes": "Explosive concentric" },
              { "name": "Dumbbell Shoulder Press", "sets": "3", "reps": "10", "weight": 22.5, "notes": "Full ROM" },
              { "name": "Pec Fly Machine", "sets": "3", "reps": "12", "weight": 45, "notes": "Squeeze at peak" }
            ]
          }
        ]
      `;

      let planData = null;
      for (const modelName of MODEL_PRIORITY) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text().replace(/```json|```/g, '').trim();
          planData = JSON.parse(text);
          console.log(`✅ PLAN GENERATED: [${modelName}] (Week ${nextWeekNum})`);
          break; 
        } catch (error) {
          console.warn(`⚠️ MODEL FAILED [${modelName}]:`, error.message);
        }
      }

      if (!planData) throw new Error("AI Generation Failed on all channels.");

      const startObj = new Date(startStr);
      const processedDays = planData.map((day, index) => ({
        ...day,
        date: addDays(startObj, index),
        isLocked: false
      }));

      const newPlan = await WeeklyPlan.create({
        userId,
        startDate: startObj,
        endDate: addDays(startObj, 7),
        startingStats: { bench, squat, deadlift, bodyWeight: 0 },
        weekNumber: nextWeekNum,
        days: processedDays,
        isActive: true
      });

      res.json({ success: true, plan: newPlan });

  } catch (error) {
      console.error("SERVER ERROR:", error);
      res.status(500).json({ error: "Mission Protocol Failed: " + error.message });
  }
});

// ==================================================
// 4. MEAL PLAN GENERATOR
// ==================================================
router.post('/meal-plan', async (req, res) => {
  try {
    const { userId, weight, height, dob, gender, goal, dietType, activityLevel, budget } = req.body;

    const birthDate = new Date(dob);
    const age = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'Male') ? 5 : -161;

    const activityMultipliers = { 'Sedentary': 1.2, 'Moderate': 1.55, 'Active': 1.725 };
    let tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));

    if (goal === 'Hypertrophy') tdee += 300; 
    if (goal === 'Fat Loss') tdee -= 400;

    const prompt = `
      ACT AS: Sports Nutritionist in Navsari, Gujarat.
      TASK: Create a 7-Day Low-Cost Student Meal Plan.
      
      USER PROFILE:
      - Age: ${age}, Gender: ${gender}
      - Calorie Target: ${tdee} kcal/day
      - Diet: ${dietType}
      - Budget: ${budget} (Local ingredients: Moong, Chana, Khichdi, Chaas)

      INSTRUCTIONS:
      1. Create a 7-Day Plan (Monday-Sunday).
      2. 4 meals per day.
      3. OUTPUT JSON ONLY.

      JSON STRUCTURE:
      {
        "meta": { "dailyCalories": ${tdee}, "goal": "${goal}" },
        "week": [
          {
            "day": "Monday",
            "macros": { "p": 120, "c": 200, "f": 60 },
            "meals": [
              { "time": "8:00 AM", "name": "Moong Chilla", "ingredients": "Besan, Spices", "calories": 400 }
            ]
          }
        ]
      }
    `;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const dietData = JSON.parse(text);

        if (userId) {
            await DietPlan.updateMany({ userId, isActive: true }, { isActive: false });
            await DietPlan.create({
                userId,
                meta: dietData.meta,
                week: dietData.week,
                isActive: true
            });
        }

        return res.json(dietData);
      } catch (error) {
        console.warn(`⚠️ FUEL MODEL FAILED [${modelName}]:`, error.message);
      }
    }
    throw new Error("Ration Systems Offline");

  } catch (error) {
    console.error("FUEL ERROR:", error);
    res.status(500).json({ error: "Diet Generation Failed" });
  }
});

// ==================================================
// 5. CHAT / ORACLE
// ==================================================
router.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  let validHistory = (history || []).filter((m, i) => i !== 0 || m.role !== 'model');

  const prompt = `Act as 'The Oracle', elite coach. User: "${message}". Keep it tactical and brief.`;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const chat = model.startChat({ history: validHistory });
      const result = await chat.sendMessage(prompt);
      const text = result.response.text().replace(/\*|#/g, '');
      return res.json({ reply: text });
    } catch (error) {
      console.warn(`⚠️ CHAT ERROR [${modelName}]: ${error.message}`);
    }
  }
  res.json({ reply: "⚠️ ORACLE OFFLINE." });
});

// ==================================================
// 6. HISTORY ENDPOINT
// ==================================================
router.get('/stats-history/:userId', async (req, res) => {
    try {
        const history = await WeeklyPlan.find({ userId: req.params.userId })
                                      .sort({ startDate: -1 }); 
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "History Logs Corrupted" });
    }
});

// ==================================================
// 7. GET ACTIVE PLAN
// ==================================================
router.get('/weekly-plan/:userId', async (req, res) => {
    try {
      const plan = await WeeklyPlan.findOne({ userId: req.params.userId, isActive: true });
      res.json(plan || null);
    } catch (err) {
      res.status(500).json({ error: "Failed to load plan" });
    }
});

// ==================================================
// 8. UPDATE PLAN
// ==================================================
router.put('/update-plan', async (req, res) => {
    try {
      const { planId, updatedDays } = req.body;
      await WeeklyPlan.findByIdAndUpdate(planId, { days: updatedDays });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save edits" });
    }
});

module.exports = router;