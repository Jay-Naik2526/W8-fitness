const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g. "Push Day"
  date: { type: Date, default: Date.now },
  exercises: [
    {
      name: String,
      sets: String,
      reps: String,
      weight: String // Optional: User can input weight later
    }
  ],
  duration: Number // minutes
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);