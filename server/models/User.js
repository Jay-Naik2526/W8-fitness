const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- IDENTITY ---
  name: { type: String, required: true, trim: true },
  
  // 👇 PHONE IS NOW THE MAIN ID (Required & Unique)
  phone: { type: String, required: true, unique: true, trim: true },
  
  // 👇 EMAIL IS NOW OPTIONAL (Not required, no unique constraint to avoid null conflicts)
  email: { type: String, trim: true, lowercase: true, default: "" },

  password: { type: String, required: true },
  image: { type: String, default: "" },

  // --- NEW FIELDS ---
  gender: { type: String, enum: ['Male', 'Female'], default: 'Male' }, 
  bio: { type: String, default: "" }, 
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  
  // --- ROLES ---
  role: {
    type: String,
    enum: ['client', 'trainer', 'admin'],
    default: 'client'
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // --- RANKING ---
  tier: { type: String, enum: ['INITIATE', 'OPERATIVE', 'ELITE', 'COMMANDER'], default: 'INITIATE' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // --- METRICS ---
  stats: {
    bench: { type: Number, default: 0 },
    squat: { type: Number, default: 0 },
    deadlift: { type: Number, default: 0 }
  },
  height: Number,
  weight: Number,
  age: Number,
  goal: { type: String, enum: ['HYPERTROPHY', 'STRENGTH', 'ENDURANCE'], default: 'HYPERTROPHY' },
  lastActive: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);