const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meta: {
    dailyCalories: Number,
    goal: String
  },
  week: [
    {
      day: String,
      macros: {
        p: Number,
        c: Number,
        f: Number
      },
      meals: [
        {
          time: String,
          name: String,
          ingredients: String,
          calories: Number
        }
      ]
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);