const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: String, default: "3" },
  reps: { type: String, default: "10" },
  weight: { type: mongoose.Schema.Types.Mixed, default: 0 }, 
  notes: { type: String, default: "" },
  videoUrl: { type: String, default: "" }
});

const DaySchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g., "Monday"
  focus: { type: String, default: "Rest" }, 
  isRest: { type: Boolean, default: false }, // 👈 NEW FIELD
  exercises: [ExerciseSchema],
  date: { type: Date }
});

const WeeklyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  weekStartDate: { type: Date, default: Date.now },
  goal: { type: String },
  days: [DaySchema], 
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeeklyPlan', WeeklyPlanSchema);