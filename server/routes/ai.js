const router = require('express').Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const WeeklyPlan = require('../models/WeeklyPlan'); 
const DietPlan = require('../models/DietPlan'); 
const ytsr = require('yt-search'); 
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_PRIORITY = ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

router.get('/proxy/video', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).send("No query");
        const searchTerm = `${query} exercise form musclewiki`;
        const results = await ytsr(searchTerm);
        const video = results.videos.length > 0 ? results.videos[0] : null;
        if (video) {
            res.json({ videoId: video.videoId, title: video.title, thumbnail: video.thumbnail });
        } else {
            res.status(404).json({ error: "Video not found" });
        }
    } catch (error) { res.status(500).json({ error: "Visual Uplink Failed" }); }
});

router.post('/generate-weekly', async (req, res) => {
  try {
      const { userId, stats, schedule, inventory } = req.body;
      const bench = stats?.bench || 0;
      const squat = stats?.squat || 0;
      const deadlift = stats?.deadlift || 0;
      const goal = stats?.goal || 'General Fitness';
      
      const startStr = stats?.startDate || new Date().toISOString();
      const startObj = new Date(startStr);
      const startDayName = startObj.toLocaleDateString('en-US', { weekday: 'long' });

      const lastPlan = await WeeklyPlan.findOne({ userId }).sort({ createdAt: -1 });
      const nextWeekNum = lastPlan ? (lastPlan.weekNumber + 1) : 1;

      await WeeklyPlan.updateMany({ userId, isActive: true }, { isActive: false });

      // --- CRITICAL FIX: PARSE SCHEDULE TO FIND REST DAYS ---
      let scheduleText = "";
      if (schedule && Array.isArray(schedule)) {
          scheduleText = schedule.map(day => {
              // If frontend says active=false, force REST
              if (!day.active) return `- ${day.label}: REST DAY (Recovery Mode)`;
              return `- ${day.label}: Equipment Mode: "${day.equipment}", Duration: ${day.duration} mins`;
          }).join("\n");
      } else {
          scheduleText = "- Default: 3 Days Full Body (60 mins)";
      }

      const prompt = `
        ACT AS: Elite Strength & Conditioning Coach.
        TASK: Generate a 7-Day Training Protocol (Week ${nextWeekNum}).
        
        **CRITICAL: The cycle starts on ${startDayName}.**
        
        OPERATIVE PROFILE (1RM):
        - Bench: ${bench}kg, Squat: ${squat}kg, Deadlift: ${deadlift}kg
        - Goal: ${goal}

        ======= INVENTORY =======
        ${inventory || "STANDARD GYM"}
        =========================

        USER SCHEDULE PREFERENCES:
        ${scheduleText}
        (Note: If a day says "REST DAY", you MUST set "focus": "Rest" and empty exercises.)

        INSTRUCTIONS:
        1. **PROGRESSIVE OVERLOAD**: Structure sets with increasing weight (Pyramid).
        2. **WEIGHT FIELD FORMAT**:
           - MUST be a text string: "Set 1: [reps]x[weight]kg, Set 2:..."
           - No single numbers.
        3. **REST DAYS**:
           - If schedule says Rest, return: { "day": "...", "focus": "Rest", "exercises": [] }
        
        JSON STRUCTURE:
        [
          {
            "day": "${startDayName}", 
            "focus": "Legs & Power",
            "exercises": [
              { "name": "Squat", "sets": "4", "reps": "12-6", "weight": "Set 1: 12x60kg, Set 2: 8x80kg", "notes": "..." }
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
        } catch (error) { console.warn(`⚠️ MODEL FAILED [${modelName}]:`, error.message); }
      }

      if (!planData) throw new Error("AI Generation Failed.");

      const processedDays = planData.map((day, index) => ({
        ...day,
        day: day.day || "Unknown",
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

// ... (KEEP THE REST OF THE FILE SAME: meal-plan, chat, history routes)
// COPY THE REST OF THE FILE FROM YOUR PREVIOUS VERSION

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