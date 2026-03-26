import PurchasedPass from '../models/PurchasedPass.model.js';

export const createPurchase = async (req, res) => {
  try {
    const purchaseData = {
      ...req.body,
      userId: req.user?._id || req.body.userId, 
      status: 'pending' // All purchases (cash or online) now start as pending for staff review.
    };

    const newPurchase = new PurchasedPass(purchaseData);
    await newPurchase.save();
    res.status(201).json(newPurchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPasses = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const passes = await PurchasedPass.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPendingPasses = async (req, res) => {
  try {
    const passes = await PurchasedPass.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPurchasedPasses = async (req, res) => {
  try {
    const passes = await PurchasedPass.find().sort({ createdAt: -1 });
    res.status(200).json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const approvePass = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedPass = await PurchasedPass.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    res.status(200).json(updatedPass);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const rejectPass = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedPass = await PurchasedPass.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
    res.status(200).json(updatedPass);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const deletePass = async (req, res) => {
  const { id } = req.params;
  try {
    await PurchasedPass.findByIdAndDelete(id);
    res.status(200).json({ message: 'Purchase record deleted' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
