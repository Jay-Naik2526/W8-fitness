const router = require('express').Router();
const Meal = require('../models/Meal');

// --- 1. GET TODAY'S MEALS ---
router.get('/:userId', async (req, res) => {
  try {
    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      userId: req.params.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. ADD A NEW MEAL ---
router.post('/add', async (req, res) => {
  try {
    const newMeal = new Meal(req.body);
    const savedMeal = await newMeal.save();
    res.json(savedMeal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. TOGGLE COMPLETED STATUS ---
router.put('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    meal.isCompleted = !meal.isCompleted;
    await meal.save();
    res.json(meal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. DELETE MEAL ---
router.delete('/:id', async (req, res) => {
    try {
      await Meal.findByIdAndDelete(req.params.id);
      res.json({ msg: "Meal deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;