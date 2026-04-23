import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  addTicketMessage,
  broadcastStaffNotification,
  chatSupport,
  createTicket,
  getHelpContent,
  getTicketById,
  listTickets,
  updateTicketStatus,
} from '../controllers/support.controller.js';

const router = express.Router();

router.get('/help', protect, getHelpContent);
router.post('/chat', protect, chatSupport);

router.get('/tickets', protect, listTickets);
router.post('/tickets', protect, authorize('student', 'canteenStaff', 'canteenManager', 'universityStaff'), createTicket);
router.get('/tickets/:ticketId', protect, getTicketById);
router.post('/tickets/:ticketId/messages', protect, addTicketMessage);
router.patch('/tickets/:ticketId/status', protect, updateTicketStatus);

router.post('/notify-staff', protect, authorize('admin', 'superAdmin'), broadcastStaffNotification);

export default router;
