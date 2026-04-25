import PurchasedPass from '../models/PurchasedPass.model.js';
import User from '../models/User.model.js';
import Canteen from '../models/Canteen.model.js';
import { sendNotification } from '../services/socket.service.js';

export const createPurchase = async (req, res) => {
  try {
    const purchaseData = {
      ...req.body,
      userId: req.user?._id || req.body.userId, 
      status: 'pending' // All purchases (cash or online) now start as pending for staff review.
    };

    const newPurchase = new PurchasedPass(purchaseData);
    await newPurchase.save();

    // Notify Staff and Admins
    try {
      // 1. Find the canteen ID from name
      const canteen = await Canteen.findOne({ name: newPurchase.canteen });
      
      // 2. Find relevant users: 
      // - Admins and Super Admins (global)
      // - Staff and Managers assigned to this specific canteen
      const targetUsers = await User.find({
        $or: [
          { role: { $in: ['admin', 'superAdmin'] } },
          { 
            role: { $in: ['canteenStaff', 'canteenManager'] }, 
            canteen: canteen?._id 
          }
        ],
        isActive: true
      });

      // 3. Send notifications
      const notificationPromises = targetUsers.map(u => 
        sendNotification(
          u._id,
          'New Meal Pass Request',
          `${newPurchase.name} has requested a ${newPurchase.duration}ly pass for ${newPurchase.mealName}.`,
          'info'
        )
      );
      await Promise.all(notificationPromises);
    } catch (notifyError) {
      console.error('Failed to send staff notifications:', notifyError);
    }

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
    
    if (updatedPass) {
      await sendNotification(
        updatedPass.userId,
        'Meal Pass Verified!',
        `Your meal pass for ${updatedPass.passName} has been verified and is ready to use.`,
        'pass_verified'
      );
    }

    res.status(200).json(updatedPass);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const rejectPass = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedPass = await PurchasedPass.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
    
    if (updatedPass) {
      await sendNotification(
        updatedPass.userId,
        'Meal Pass Rejected',
        `Your meal pass for ${updatedPass.passName} was rejected. Please contact staff for details.`,
        'pass_rejected'
      );
    }

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
