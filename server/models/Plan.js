const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Standard Floor"
  category: { type: String, enum: ['GYM', 'PT', 'PRO', 'PILATES'], required: true },
  duration: { type: String, required: true }, // e.g., "1 Month", "1 Year"
  price: { type: Number, required: true },
  features: [String], // List of perks
  highlight: { type: Boolean, default: false }, // "Popular" tag
  order: { type: Number, default: 0 } // To control sorting
});

module.exports = mongoose.model('Plan', PlanSchema);