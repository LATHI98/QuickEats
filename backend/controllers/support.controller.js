import Order from '../models/Order.model.js';
import Canteen from '../models/Canteen.model.js';
import Budget from '../models/Budget.model.js';
import GroupSession from '../models/GroupSession.model.js';
import SupportTicket, { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../models/SupportTicket.model.js';
import SupportTicketMessage from '../models/SupportTicketMessage.model.js';
import {
  sendSupportTicketCreatedEmail,
  sendSupportTicketReplyEmail,
  sendSupportTicketResolvedEmail,
} from '../services/email.service.js';

const SUPPORT_ASSISTANT_NAME = 'Q-Guide';

const HELP_ARTICLES = [
  {
    id: 'order-tracking',
    title: 'How to track an order',
    category: 'order_issue',
    summary: 'Open Orders to check the latest order state, payment status, and pickup details.',
    keywords: ['order', 'tracking', 'status', 'pickup'],
  },
  {
    id: 'payment-help',
    title: 'Payment not going through',
    category: 'payment_issue',
    summary: 'Make sure your payment method is valid, then retry from the order payment page.',
    keywords: ['payment', 'card', 'stripe', 'cash', 'refund'],
  },
  {
    id: 'settings-and-notifications',
    title: 'Settings and notifications',
    category: 'account_issue',
    summary: 'Use Settings to update account preferences and notification behavior, then save your changes.',
    keywords: ['settings', 'notifications', 'preference', 'alert'],
  },
  {
    id: 'group-order-help',
    title: 'Group ordering basics',
    category: 'order_issue',
    summary: 'Create or join a group order from Group Order, then lock the session before placing the shared order.',
    keywords: ['group order', 'group', 'share code', 'members'],
  },
  {
    id: 'budget-help',
    title: 'Meal budget guidance',
    category: 'general',
    summary: 'Open Meal Budget to set weekly or monthly limits and track your current spend against the target.',
    keywords: ['budget', 'meal budget', 'spending', 'weekly', 'monthly'],
  },
  {
    id: 'account-help',
    title: 'Account access and creation',
    category: 'account_issue',
    summary: 'Use Register for new user accounts. For access issues, use password reset and account verification.',
    keywords: ['account', 'login', 'password', 'verify', 'register', 'create account'],
  },
  {
    id: 'canteen-creation-help',
    title: 'Creating a canteen',
    category: 'canteen_issue',
    summary: 'Admins can create canteens from the admin Canteens page by filling details and saving.',
    keywords: ['create canteen', 'add canteen', 'canteen creation', 'canteen'],
  },
];

const isElevatedSupportRole = (role) => ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'].includes(role);
const isAdminSupportRole = (role) => ['admin', 'superAdmin'].includes(role);
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeText = (value = '') => String(value || '').trim();

const sanitizeTicketForRole = (ticket, role) => {
  if (!ticket) return ticket;
  if (isAdminSupportRole(role)) return ticket;

  const safeTicket = typeof ticket.toObject === 'function' ? ticket.toObject() : { ...ticket };
  safeTicket.requester = null;

  if (Array.isArray(safeTicket.activityLogs)) {
    safeTicket.activityLogs = safeTicket.activityLogs.map((item) => ({
      ...item,
      actor: null,
      actorRole: null,
    }));
  }

  return safeTicket;
};

const sanitizeMessageForRole = (message, role) => {
  if (!message) return message;
  if (isAdminSupportRole(role)) return message;

  const safeMessage = typeof message.toObject === 'function' ? message.toObject() : { ...message };
  safeMessage.sender = null;
  safeMessage.senderRole = 'private';
  return safeMessage;
};

const sanitizeTicketBundleForRole = (bundle, role) => {
  if (!bundle) return bundle;
  return {
    ticket: sanitizeTicketForRole(bundle.ticket, role),
    messages: Array.isArray(bundle.messages)
      ? bundle.messages.map((msg) => sanitizeMessageForRole(msg, role))
      : [],
  };
};

const pushActivity = (ticketDoc, { action, actor, actorRole, note = '', metadata = null }) => {
  ticketDoc.activityLogs = ticketDoc.activityLogs || [];
  ticketDoc.activityLogs.push({
    action,
    actor,
    actorRole,
    note,
    metadata,
    createdAt: new Date(),
  });
};

const getTicketAccessFilter = (user) => (isElevatedSupportRole(user.role) ? {} : { requester: user._id });

const canAccessTicket = (ticketDoc, user) => {
  if (!ticketDoc) return false;
  if (isElevatedSupportRole(user.role)) return true;
  return String(ticketDoc.requester?._id || ticketDoc.requester) === String(user._id);
};

const inferCategory = (text = '') => {
  const normalized = text.toLowerCase();
  if (/(payment|refund|cash|stripe|card|transaction)/.test(normalized)) return 'payment_issue';
  if (/(order|pickup|tracking|status|missing|wrong item|late)/.test(normalized)) return 'order_issue';
  if (/(queue|crowd|crowded|busy|canteen|wait)/.test(normalized)) return 'canteen_issue';
  if (/(reservation|table|booking)/.test(normalized)) return 'reservation_issue';
  if (/(account|login|password|verify|signup)/.test(normalized)) return 'account_issue';
  if (/(feature|suggest|request|idea)/.test(normalized)) return 'feature_request';
  return 'general';
};

const inferPriority = (text = '') => {
  const normalized = text.toLowerCase();
  if (/(urgent|asap|immediately|now|critical|blocked)/.test(normalized)) return 'urgent';
  if (/(angry|failed|stuck|broken|still not|no response|wrong)/.test(normalized)) return 'high';
  return 'medium';
};

const findBestArticle = (text = '') => {
  const normalized = text.toLowerCase();
  return HELP_ARTICLES.find((article) => article.keywords.some((keyword) => normalized.includes(keyword))) || null;
};

const OUT_OF_SCOPE_PATTERN = /(menu management|manage menu|menu item|edit menu|add menu|menu-related|menu related|real\s*time\s*crowd|crowd monitoring|live crowd|queue monitoring|queue status|wait time prediction|crowd status)/i;

const detectDomain = (text = '') => {
  const normalized = text.toLowerCase();

  if (/(setting|settings|preference|profile setting)/.test(normalized)) return 'settings';
  if (/(notification|alert|reminder)/.test(normalized)) return 'notifications';
  if (/(account creation|create account|register|signup|sign up|new account|user account)/.test(normalized)) return 'account_creation';
  if (/(group order|share code|group session|members)/.test(normalized)) return 'group_ordering';
  if (/(meal budget|budget|weekly limit|monthly limit|spending)/.test(normalized)) return 'meal_budget';
  if (/(ticket|support request|support ticket|escalat)/.test(normalized)) return 'ticketing';
  if (/(create canteen|add canteen|canteen creation)/.test(normalized)) return 'canteen_creation';
  if (/(order|tracking|pickup|payment|cancel order|place order)/.test(normalized)) return 'ordering';

  return 'general';
};

const buildDomainGuidance = (domain, user, liveContext = {}) => {
  if (domain === 'settings') {
    return 'Q-Guide: For settings, open your dashboard settings/profile area, update the needed fields, then save. If a change does not persist, log out and sign in again, then open a support ticket if it still fails.';
  }

  if (domain === 'notifications') {
    return 'Q-Guide: For notifications, check your account settings and browser/app permission settings, then verify notifications are enabled for QuickEats. If notifications still do not appear, create a support ticket and mention device + browser/app version.';
  }

  if (domain === 'account_creation') {
    if (isElevatedSupportRole(user?.role)) {
      return 'Q-Guide: User accounts can be created through the Register flow for standard users. For managed staff/admin onboarding, use the admin user management path and assign the correct role carefully.';
    }
    return 'Q-Guide: To create an account, use the Register page and complete verification. If registration fails, check email format and try password reset/verification steps.';
  }

  if (domain === 'ordering') {
    if (liveContext.order) {
      return `Your latest order ${liveContext.order.queueNumber} at ${liveContext.order.canteenName} is currently ${liveContext.order.status}. You can continue tracking it from My Orders.`;
    }
    return 'Q-Guide: For ordering, choose a canteen, add items to cart, complete payment, then track status in My Orders. If payment or status fails, create a support ticket with order details.';
  }

  if (domain === 'group_ordering') {
    if (liveContext.groupSession) {
      return `Your latest group session "${liveContext.groupSession.name}" is ${liveContext.groupSession.status} with ${liveContext.groupSession.memberCount} member(s). Use Group Order to manage members and lock before checkout.`;
    }
    return 'Q-Guide: For group ordering, create a session, share the code, let members add items, then lock the session and place the order according to payment mode.';
  }

  if (domain === 'meal_budget') {
    if (liveContext.budget) {
      return `Your meal budget is ${liveContext.budget.currency} ${liveContext.budget.amount} (${liveContext.budget.period}). Update it in Meal Budget if your spending target changed.`;
    }
    return 'Q-Guide: For meal budget, open Meal Budget, set weekly or monthly amount, and track spending against that target. You can adjust the budget anytime.';
  }

  if (domain === 'ticketing') {
    return 'Q-Guide: For ticketing, open Help Center, create a ticket with clear subject and description, and continue replies in the ticket thread. You can also escalate from chat after confirmation.';
  }

  if (domain === 'canteen_creation') {
    const countText = Number.isFinite(liveContext.canteenCount) ? ` There are currently ${liveContext.canteenCount} canteen(s) in the system.` : '';
    if (!isElevatedSupportRole(user?.role)) {
      return `Q-Guide: Canteen creation is admin/staff managed. Please contact an admin to create a canteen for you.${countText}`;
    }
    return `Q-Guide: To create a canteen, go to Admin > Canteens, fill name/owner/email/open hours, and save.${countText}`;
  }

  return 'Q-Guide: This question is outside the current support context.';
};

const buildLiveContext = async (user, query = '', extra = {}) => {
  const normalizedQuery = query.toLowerCase();
  const context = {};

  if (/(order|tracking|pickup|status)/.test(normalizedQuery)) {
    const recentOrder = await Order.findOne({ student: user._id }).sort({ createdAt: -1 }).populate('canteen', 'name');
    if (recentOrder) {
      context.order = {
        id: recentOrder._id,
        queueNumber: recentOrder.queueNumber,
        status: recentOrder.status,
        canteenName: recentOrder.canteen?.name || 'the canteen',
        updatedAt: recentOrder.updatedAt,
      };
    }
  }

  if (/(group order|share code|group session|members)/.test(normalizedQuery)) {
    const groupSession = await GroupSession.findOne({
      $or: [{ creator: user._id }, { members: user._id }],
    }).sort({ updatedAt: -1 });

    if (groupSession) {
      context.groupSession = {
        id: groupSession._id,
        name: groupSession.name,
        status: groupSession.status,
        memberCount: Array.isArray(groupSession.members) ? groupSession.members.length : 0,
        paymentMode: groupSession.paymentMode,
      };
    }
  }

  if (/(meal budget|budget|weekly limit|monthly limit|spending)/.test(normalizedQuery)) {
    const budget = await Budget.findOne({ userId: user._id });
    if (budget) {
      context.budget = {
        amount: budget.amount,
        period: budget.period,
        currency: budget.currency,
      };
    }
  }

  if (/(create canteen|add canteen|canteen creation)/.test(normalizedQuery)) {
    context.canteenCount = await Canteen.countDocuments();
  }

  return context;
};

const buildChatResponse = ({ query, liveContext, user }) => {
  const normalized = query.toLowerCase();
  const article = findBestArticle(query);
  const category = inferCategory(query);
  const priority = inferPriority(query);
  const unresolvedSignals = /(complain|problem|issue|broken|wrong|not working|cannot|can't|failed|error|refund|chargeback|late|missing)/.test(normalized);
  const domain = detectDomain(query);

  if (OUT_OF_SCOPE_PATTERN.test(normalized)) {
    return {
      answer: 'This question is outside the current support context.',
      needsHumanSupport: true,
      autoCreateTicket: true,
      suggestedTicket: {
        subject: 'Support request for out-of-scope issue',
        category: 'general',
        priority: 'medium',
      },
      relatedArticles: [],
      domain: 'out_of_scope',
    };
  }

  const domainAnswer = buildDomainGuidance(domain, user, liveContext);

  if (domain === 'ordering' && liveContext.order) {
    return {
      answer: domainAnswer,
      needsHumanSupport: unresolvedSignals,
      suggestedTicket: {
        subject: `Order support for #${liveContext.order.queueNumber}`,
        category,
        priority,
      },
      relatedArticles: article ? [article] : [],
      domain,
    };
  }

  if (article) {
    return {
      answer: `${article.summary} ${domainAnswer}`,
      needsHumanSupport: unresolvedSignals,
      suggestedTicket: {
        subject: article.title,
        category: article.category,
        priority,
      },
      relatedArticles: [article],
      domain,
    };
  }

  return {
    answer: domainAnswer,
    needsHumanSupport: true,
    autoCreateTicket: domain === 'general',
    suggestedTicket: {
      subject: domain === 'general' ? 'General support request' : `${domain.replaceAll('_', ' ')} support request`,
      category: category || 'general',
      priority,
    },
    relatedArticles: HELP_ARTICLES.slice(0, 3),
    domain,
  };
};

const populateTicketDetail = async (ticketId) => {
  const ticket = await SupportTicket.findById(ticketId)
    .populate('requester', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('canteen', 'name')
    .populate('order', 'queueNumber status createdAt');

  if (!ticket) return null;

  const messages = await SupportTicketMessage.find({ ticket: ticket._id })
    .populate('sender', 'name email role')
    .sort({ createdAt: 1 });

  return { ticket, messages };
};

export const getHelpContent = async (req, res) => {
  try {
    const query = normalizeText(req.query?.q);
    const filteredArticles = query
      ? HELP_ARTICLES.filter((article) => article.keywords.some((keyword) => query.toLowerCase().includes(keyword)))
      : HELP_ARTICLES;

    return res.json({
      success: true,
      articles: filteredArticles,
      categories: SUPPORT_CATEGORIES,
      priorities: SUPPORT_PRIORITIES,
      statuses: SUPPORT_STATUSES,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not load help content' });
  }
};

export const chatSupport = async (req, res) => {
  try {
    const query = normalizeText(req.body?.message || req.body?.query);
    const extra = {
      canteenId: req.body?.canteenId || null,
    };

    if (!query) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const liveContext = await buildLiveContext(req.user, query, extra);
    const response = buildChatResponse({ query, liveContext, user: req.user });

    return res.json({
      success: true,
      assistantName: SUPPORT_ASSISTANT_NAME,
      responseSource: 'rules',
      liveContext,
      ...response,
    });
  } catch (error) {
    console.error('Support chat error:', error);
    return res.status(500).json({ success: false, message: 'Could not process support chat' });
  }
};

export const listTickets = async (req, res) => {
  try {
    const filter = getTicketAccessFilter(req.user);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;

    const search = normalizeText(req.query.q);
    if (search) {
      filter.$or = [
        { subject: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
        { chatSummary: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const tickets = await SupportTicket.find(filter)
      .populate('requester', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('canteen', 'name')
      .sort({ updatedAt: -1 })
      .limit(100);

    const safeTickets = tickets.map((ticket) => sanitizeTicketForRole(ticket, req.user.role));
    return res.json({ success: true, tickets: safeTickets });
  } catch (error) {
    console.error('List support tickets error:', error);
    return res.status(500).json({ success: false, message: 'Could not load tickets' });
  }
};

export const createTicket = async (req, res) => {
  try {
    const {
      subject,
      description,
      category = 'general',
      priority = 'medium',
      source = 'manual',
      canteenId = null,
      orderId = null,
      chatSummary = '',
      metadata = null,
      attachments = [],
    } = req.body;

    const normalizedSubject = normalizeText(subject);
    const normalizedDescription = normalizeText(description);

    if (!normalizedSubject || normalizedSubject.length < 3) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }

    if (!normalizedDescription || normalizedDescription.length < 10) {
      return res.status(400).json({ success: false, message: 'description is required' });
    }

    const ticket = await SupportTicket.create({
      requester: req.user._id,
      canteen: canteenId || req.user.canteen || null,
      order: orderId || null,
      subject: normalizedSubject,
      description: normalizedDescription,
      category: SUPPORT_CATEGORIES.includes(category) ? category : inferCategory(`${normalizedSubject} ${normalizedDescription}`),
      priority: SUPPORT_PRIORITIES.includes(priority) ? priority : inferPriority(`${normalizedSubject} ${normalizedDescription}`),
      status: 'open',
      source,
      attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
      chatSummary: normalizeText(chatSummary),
      metadata,
      lastMessageAt: new Date(),
      activityLogs: [],
    });

    pushActivity(ticket, {
      action: 'created',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Ticket created',
      metadata: { source, category: ticket.category, priority: ticket.priority },
    });
    await ticket.save();

    const message = await SupportTicketMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderRole: req.user.role,
      message: normalizedDescription,
      attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
      isInternal: false,
    });

    const populated = await populateTicketDetail(ticket._id);
    await sendSupportTicketCreatedEmail(req.user.email, populated.ticket);

    const safeBundle = sanitizeTicketBundleForRole(populated, req.user.role);

    return res.status(201).json({
      success: true,
      ticket: safeBundle.ticket,
      messages: safeBundle.messages,
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ success: false, message: 'Could not create ticket' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const populated = await populateTicketDetail(req.params.ticketId);
    if (!populated) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!canAccessTicket(populated.ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    const safeBundle = sanitizeTicketBundleForRole(populated, req.user.role);
    return res.json({ success: true, ticket: safeBundle.ticket, messages: safeBundle.messages });
  } catch (error) {
    console.error('Get support ticket error:', error);
    return res.status(500).json({ success: false, message: 'Could not load ticket' });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const messageText = normalizeText(req.body?.message);
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments.filter(Boolean) : [];

    if (!messageText || messageText.length < 2) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    const isInternal = req.body?.isInternal === true && isElevatedSupportRole(req.user.role);
    const message = await SupportTicketMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderRole: req.user.role,
      message: messageText,
      attachments,
      isInternal,
    });

    ticket.lastMessageAt = new Date();
    if (ticket.status === 'closed' && !isElevatedSupportRole(req.user.role)) {
      ticket.status = 'open';
    } else if (ticket.status === 'open' && isElevatedSupportRole(req.user.role)) {
      ticket.status = 'in_progress';
    }
    pushActivity(ticket, {
      action: 'message_added',
      actor: req.user._id,
      actorRole: req.user.role,
      note: isInternal ? 'Internal note added' : 'Message added',
    });
    await ticket.save();

    const populatedMessage = await message.populate('sender', 'name email role');
    if (!isInternal) {
      const populatedTicket = await populateTicketDetail(ticket._id);
      await sendSupportTicketReplyEmail(populatedTicket.ticket.requester?.email, populatedTicket.ticket, messageText);
    }

    const safeMessage = sanitizeMessageForRole(populatedMessage, req.user.role);
    return res.status(201).json({ success: true, message: safeMessage });
  } catch (error) {
    console.error('Add support message error:', error);
    return res.status(500).json({ success: false, message: 'Could not add message' });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!isElevatedSupportRole(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update ticket status' });
    }

    const nextStatus = req.body?.status;
    if (!SUPPORT_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    ticket.status = nextStatus;
    if (nextStatus === 'resolved') ticket.resolvedAt = new Date();
    if (nextStatus === 'closed') ticket.closedAt = new Date();
    if (nextStatus === 'open') {
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    if (req.body?.assignedTo !== undefined) {
      ticket.assignedTo = req.body.assignedTo || null;
    }

    pushActivity(ticket, {
      action: 'status_changed',
      actor: req.user._id,
      actorRole: req.user.role,
      note: `Status updated to ${nextStatus}`,
      metadata: { assignedTo: req.body?.assignedTo || null },
    });
    await ticket.save();

    if (nextStatus === 'resolved' || nextStatus === 'closed') {
      const populatedTicket = await populateTicketDetail(ticket._id);
      await sendSupportTicketResolvedEmail(populatedTicket.ticket, req.user);
      const safeBundle = sanitizeTicketBundleForRole(populatedTicket, req.user.role);
      return res.json({ success: true, ticket: safeBundle.ticket, messages: safeBundle.messages });
    }

    const populated = await populateTicketDetail(ticket._id);
    const safeBundle = sanitizeTicketBundleForRole(populated, req.user.role);
    return res.json({ success: true, ticket: safeBundle.ticket, messages: safeBundle.messages });
  } catch (error) {
    console.error('Update support ticket error:', error);
    return res.status(500).json({ success: false, message: 'Could not update ticket' });
  }
};
