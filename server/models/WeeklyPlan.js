const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: String, default: "3" },
  reps: { type: String, default: "10" },
  // --- CRITICAL FIX: Changed from Number to Mixed ---
  // This allows "20" (kg) AND "Moderate RPE 7" (Text)
  weight: { type: mongoose.Schema.Types.Mixed, default: 0 }, 
  notes: { type: String, default: "" }
});

const DaySchema = new mongoose.Schema({
  day: { type: String }, // e.g., "Monday"
  focus: { type: String }, // e.g., "Push"
  exercises: [ExerciseSchema],
  date: { type: Date }
});

const WeeklyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, default: Date.now },
  goal: { type: String },
  days: [DaySchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeeklyPlan', WeeklyPlanSchema);