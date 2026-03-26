import MealPass from '../models/MealPass.model.js';

export const getMealPasses = async (req, res) => {
  try {
    const mealPasses = await MealPass.find({ isActive: true });
    res.status(200).json(mealPasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMealPass = async (req, res) => {
  const mealPass = req.body;
  const newMealPass = new MealPass(mealPass);
  try {
    await newMealPass.save();
    res.status(201).json(newMealPass);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateMealPass = async (req, res) => {
  const { id } = req.params;
  const mealPass = req.body;
  try {
    const updatedMealPass = await MealPass.findByIdAndUpdate(id, mealPass, { new: true });
    res.status(200).json(updatedMealPass);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteMealPass = async (req, res) => {
  const { id } = req.params;
  try {
    await MealPass.findByIdAndDelete(id);
    res.status(200).json({ message: 'MealPass deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
