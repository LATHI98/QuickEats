import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  addTicketMessage,
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
router.post('/tickets', protect, createTicket);
router.get('/tickets/:ticketId', protect, getTicketById);
router.post('/tickets/:ticketId/messages', protect, addTicketMessage);
router.patch('/tickets/:ticketId/status', protect, updateTicketStatus);

export default router;
