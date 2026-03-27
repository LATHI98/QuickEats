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
  try {
    const mealData = req.body;
    
    // If sent via FormData, tags might be a string
    if (typeof mealData.tags === 'string') {
      mealData.tags = mealData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }

    if (req.file) {
      mealData.image = `/uploads/${req.file.filename}`;
    }

    const newMealPass = new MealPass(mealData);
    await newMealPass.save();
    res.status(201).json(newMealPass);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateMealPass = async (req, res) => {
  const { id } = req.params;
  try {
    const mealData = req.body;

    // Handle tags parsing
    if (typeof mealData.tags === 'string') {
      mealData.tags = mealData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }

    if (req.file) {
      mealData.image = `/uploads/${req.file.filename}`;
    }

    const updatedMealPass = await MealPass.findByIdAndUpdate(id, mealData, { new: true });
    
    if (!updatedMealPass) {
      return res.status(404).json({ message: 'Meal pass not found' });
    }

    res.status(200).json(updatedMealPass);
  } catch (error) {
    console.error('Update Meal Pass error:', error);
    res.status(500).json({ message: error.message });
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
