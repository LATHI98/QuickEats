import EventCateringRequest, { REQUEST_STATUSES } from '../models/EventCateringRequest.model.js';
import EventCateringPackage from '../models/EventCateringPackage.model.js';
import { sendCateringStatusEmail } from '../services/email.service.js';
import Stripe from 'stripe';

const isElevatedOpsRole = (role) => ['admin', 'superAdmin', 'canteenManager'].includes(role);
const ALLOWED_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mixed'];
const ALLOWED_PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'refunded'];
const MIN_HEADCOUNT = 10;
const MAX_HEADCOUNT = 2000;
const MAX_SELECTED_ITEMS = 60;
const MAX_LINE_ITEMS = 80;
const MAX_EVENT_DAYS_AHEAD = 365;
const MIN_EVENT_LEAD_HOURS = 2;

const appendActivity = (requestDoc, { action, actor = null, actorRole = null, note = '', metadata = null }) => {
  requestDoc.activityLogs = requestDoc.activityLogs || [];
  requestDoc.activityLogs.push({
    action,
    actor,
    actorRole,
    note,
    metadata,
    createdAt: new Date(),
  });
};

const resolveCanteenContext = (req, canteenFromResource = null) => {
  const requestedCanteenId = req.query?.canteen || req.body?.canteenId || null;
  const assignedCanteenId = req.user?.canteen ? req.user.canteen.toString() : null;
  const canteenId = canteenFromResource || requestedCanteenId || assignedCanteenId || null;

  if (!canteenId) {
    return { ok: false, status: 400, code: 'CANTEEN_CONTEXT_REQUIRED', message: 'Please select a canteen context.' };
  }

  if (!isElevatedOpsRole(req.user.role) && assignedCanteenId && requestedCanteenId && assignedCanteenId !== requestedCanteenId) {
    return { ok: false, status: 403, code: 'STAFF_CANTEEN_MISMATCH', message: 'You are not authorized for the selected canteen.' };
  }

  return { ok: true, canteenId };
};

const calcQuoteTotals = (lineItems = [], serviceFee = 0, discount = 0) => {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const totalQuoted = Math.max(0, subtotal + Number(serviceFee || 0) - Number(discount || 0));
  return { subtotal, totalQuoted };
};

const computeQuotePayableOptions = (requestDoc) => {
  const quotedTotal = Number(requestDoc.quote?.totalQuoted || 0);
  const halfPaymentTotal = Math.max(0, Math.round((quotedTotal / 2) * 100) / 100);
  const threeQuarterPaymentTotal = Math.max(0, Math.round((quotedTotal * 0.75) * 100) / 100);

  return {
    quotedTotal,
    halfPaymentTotal,
    threeQuarterPaymentTotal,
  };
};

const resolveActiveTotalPayable = (requestDoc) => {
  const options = computeQuotePayableOptions(requestDoc);
  return options.quotedTotal;
};

const trimText = (value, fallback = '') => String(value ?? fallback).trim();

const validateCreatePayload = ({ eventName, eventDateTime, headcount, venue, budget, preferredPaymentMethod, selectedItems, packageId }) => {
  const errors = [];
  const normalizedEventName = trimText(eventName);
  const normalizedVenue = trimText(venue);
  const normalizedHeadcount = Number(headcount);
  const eventDate = new Date(eventDateTime);
  const now = new Date();
  const latestAllowed = new Date(now.getTime() + MAX_EVENT_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const minLeadTime = new Date(now.getTime() + MIN_EVENT_LEAD_HOURS * 60 * 60 * 1000);

  if (!normalizedEventName || normalizedEventName.length < 3 || normalizedEventName.length > 120) {
    errors.push('eventName must be 3-120 characters.');
  }
  if (!normalizedVenue || normalizedVenue.length < 3 || normalizedVenue.length > 180) {
    errors.push('venue must be 3-180 characters.');
  }
  if (!Number.isFinite(normalizedHeadcount) || normalizedHeadcount < MIN_HEADCOUNT || normalizedHeadcount > MAX_HEADCOUNT) {
    errors.push(`headcount must be between ${MIN_HEADCOUNT} and ${MAX_HEADCOUNT}.`);
  }
  if (Number.isNaN(eventDate.getTime())) {
    errors.push('eventDateTime must be a valid date/time.');
  } else {
    if (eventDate < minLeadTime) errors.push(`eventDateTime must be at least ${MIN_EVENT_LEAD_HOURS} hours from now.`);
    if (eventDate > latestAllowed) errors.push(`eventDateTime cannot be more than ${MAX_EVENT_DAYS_AHEAD} days ahead.`);
  }
  if (budget != null && budget !== '') {
    const normalizedBudget = Number(budget);
    if (!Number.isFinite(normalizedBudget) || normalizedBudget < 0) errors.push('budget must be a non-negative number.');
  }
  if (!ALLOWED_PAYMENT_METHODS.includes(preferredPaymentMethod)) {
    errors.push('preferredPaymentMethod is invalid.');
  }
  if (!packageId && (!Array.isArray(selectedItems) || selectedItems.length === 0)) {
    errors.push('At least one selected item is required when no package is selected.');
  }

  return {
    errors,
    normalized: {
      eventName: normalizedEventName,
      venue: normalizedVenue,
      headcount: normalizedHeadcount,
      eventDate,
    },
  };
};

const validateRequestedItems = (items = []) => {
  const errors = [];
  if (!Array.isArray(items)) return { errors: ['selectedItems must be an array.'] };
  if (items.length > MAX_SELECTED_ITEMS) {
    errors.push(`selectedItems cannot exceed ${MAX_SELECTED_ITEMS}.`);
  }
  items.forEach((item, idx) => {
    const name = trimText(item?.name);
    const qty = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice || 0);
    if (!name || name.length > 120) errors.push(`selectedItems[${idx}] name is required and must be <= 120 chars.`);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000) errors.push(`selectedItems[${idx}] quantity must be 1-10000.`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push(`selectedItems[${idx}] unitPrice must be >= 0.`);
  });
  return { errors };
};

const validateQuotePayload = ({ lineItems, serviceFee, discount, validUntil, estimatedPrepMinutes, packageId }) => {
  const errors = [];
  if (!packageId && (!Array.isArray(lineItems) || lineItems.length === 0)) {
    errors.push('lineItems are required if no package is selected.');
  }
  if (Array.isArray(lineItems) && lineItems.length > MAX_LINE_ITEMS) {
    errors.push(`lineItems cannot exceed ${MAX_LINE_ITEMS}.`);
  }
  if (serviceFee != null && (!Number.isFinite(Number(serviceFee)) || Number(serviceFee) < 0)) {
    errors.push('serviceFee must be a non-negative number.');
  }
  if (discount != null && (!Number.isFinite(Number(discount)) || Number(discount) < 0)) {
    errors.push('discount must be a non-negative number.');
  }
  if (estimatedPrepMinutes != null && (!Number.isFinite(Number(estimatedPrepMinutes)) || Number(estimatedPrepMinutes) < 15 || Number(estimatedPrepMinutes) > 24 * 60)) {
    errors.push('estimatedPrepMinutes must be between 15 and 1440.');
  }
  if (validUntil) {
    const validUntilDate = new Date(validUntil);
    if (Number.isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
      errors.push('validUntil must be a valid future date/time.');
    }
  }
  return { errors };
};

const normalizeRequestedItems = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        name: String(item.name || '').trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        notes: String(item.notes || '').trim(),
      }))
      .filter((item) => item.name && item.quantity > 0)
    : []
);

const getRequesterId = (requestDoc) => {
  const requester = requestDoc?.requester;
  if (!requester) return '';
  if (typeof requester === 'string') return requester;
  if (requester?._id) return requester._id.toString();
  if (typeof requester?.toString === 'function') return requester.toString();
  return '';
};

const isRequester = (requestDoc, userId) => getRequesterId(requestDoc) === String(userId || '');

const transitionMap = {
  requested: ['quoted', 'rejected'],
  quoted: ['approved', 'rejected'],
  approved: ['in_prep', 'rejected'],
  in_prep: ['ready'],
  ready: ['delivered'],
  delivered: [],
  rejected: [],
};

let _stripe;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

const assertCapacity = async ({ canteenId, eventDateTime, estimatedPrepMinutes, ignoreRequestId = null }) => {
  const prepStart = new Date(eventDateTime.getTime() - estimatedPrepMinutes * 60 * 1000);
  const prepEnd = new Date(eventDateTime);

  const overlapFilter = {
    canteen: canteenId,
    status: { $in: ['approved', 'in_prep', 'ready'] },
    _id: ignoreRequestId ? { $ne: ignoreRequestId } : { $exists: true },
    prepStartAt: { $lt: prepEnd },
    eventDateTime: { $gt: prepStart },
  };

  const overlapping = await EventCateringRequest.countDocuments(overlapFilter);
  const MAX_PARALLEL_PREP = 6;
  if (overlapping >= MAX_PARALLEL_PREP) {
    const err = new Error('Canteen prep capacity is full for that time window.');
    err.statusCode = 409;
    throw err;
  }

  return { prepStart };
};

export const createEventCateringRequest = async (req, res) => {
  try {
    const {
      eventName,
      eventDateTime,
      headcount,
      venue,
      budget,
      notes,
      selectedItems = [],
      packageId = null,
      preferredPaymentMethod = 'cash',
    } = req.body;

    const baseValidation = validateCreatePayload({
      eventName,
      eventDateTime,
      headcount,
      venue,
      budget,
      preferredPaymentMethod,
      selectedItems,
      packageId,
    });
    const itemValidation = validateRequestedItems(selectedItems);
    const allErrors = [...baseValidation.errors, ...itemValidation.errors];
    if (allErrors.length) {
      return res.status(400).json({ success: false, message: allErrors[0], errors: allErrors });
    }

    const context = resolveCanteenContext(req);
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    const doc = new EventCateringRequest({
      requester: req.user._id,
      canteen: context.canteenId,
      eventName: baseValidation.normalized.eventName,
      eventDateTime: baseValidation.normalized.eventDate,
      headcount: baseValidation.normalized.headcount,
      venue: baseValidation.normalized.venue,
      budget: budget ?? null,
      notes: notes || '',
      selectedItems: normalizeRequestedItems(selectedItems),
      payment: {
        preferredMethod: preferredPaymentMethod,
        status: 'pending',
        amountPaid: 0,
        amountDue: 0,
      },
    });

    if (packageId) {
      const pkg = await EventCateringPackage.findById(packageId);
      if (!pkg || !pkg.isActive) {
        return res.status(404).json({ success: false, message: 'Selected package not found.' });
      }
      if (baseValidation.normalized.headcount < Number(pkg.minHeadcount || MIN_HEADCOUNT)) {
        return res.status(400).json({ success: false, message: `Headcount must be at least ${pkg.minHeadcount} for this package.` });
      }
      if (pkg.maxHeadcount && baseValidation.normalized.headcount > Number(pkg.maxHeadcount)) {
        return res.status(400).json({ success: false, message: `Headcount cannot exceed ${pkg.maxHeadcount} for this package.` });
      }
      doc.quote.packageId = pkg._id;
      doc.quote.packageName = pkg.name;
      doc.estimatedPrepMinutes = pkg.estimatedPrepMinutes || doc.estimatedPrepMinutes;
    }

    appendActivity(doc, {
      action: 'request_created',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Event catering request submitted.',
    });

    await doc.save();
    const populated = await EventCateringRequest.findById(doc._id)
      .populate('requester', 'name email role')
      .populate('canteen', 'name')
      .populate('quote.packageId', 'name basePrice');

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getMyEventCateringRequests = async (req, res) => {
  try {
    const filter = { requester: req.user._id };
    if (req.query.status && REQUEST_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const requests = await EventCateringRequest.find(filter)
      .populate('canteen', 'name')
      .populate('quote.packageId', 'name basePrice')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyEventCateringRequestById = async (req, res) => {
  try {
    const requestDoc = await EventCateringRequest.findById(req.params.requestId)
      .populate('canteen', 'name')
      .populate('requester', 'name email role')
      .populate('quote.packageId', 'name basePrice')
      .populate('quote.preparedBy', 'name email role')
      .populate('activityLogs.actor', 'name email role');

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const confirmCateringQuote = async (req, res) => {
  try {
    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (requestDoc.status !== 'quoted') {
      return res.status(400).json({ success: false, message: 'Only quoted requests can be approved by student.' });
    }
    if (!Number(requestDoc.quote?.totalQuoted || 0)) {
      return res.status(400).json({ success: false, message: 'Quote amount is missing. Ask canteen staff to revise quote.' });
    }
    if (requestDoc.quote?.validUntil && new Date(requestDoc.quote.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: 'Quote has expired. Ask canteen staff to update quote.' });
    }

    requestDoc.status = 'approved';
    requestDoc.quote.studentConfirmedAt = new Date();

    appendActivity(requestDoc, {
      action: 'quote_confirmed',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Student confirmed quote.',
    });

    await requestDoc.save();

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCanteenEventCateringRequests = async (req, res) => {
  try {
    const requestedCanteenId = req.query?.canteen || null;
    const assignedCanteenId = req.user?.canteen ? req.user.canteen.toString() : null;
    const isElevatedViewer = ['admin', 'superAdmin', 'canteenManager'].includes(req.user?.role);

    const filter = {};
    if (requestedCanteenId) {
      filter.canteen = requestedCanteenId;
    } else if (assignedCanteenId) {
      filter.canteen = assignedCanteenId;
    } else if (!isElevatedViewer) {
      return res.status(400).json({ success: false, code: 'CANTEEN_CONTEXT_REQUIRED', message: 'Please select a canteen context.' });
    }

    if (req.query.status && REQUEST_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const requests = await EventCateringRequest.find(filter)
      .populate('requester', 'name email studentId')
      .populate('canteen', 'name')
      .populate('quote.preparedBy', 'name email role')
      .populate('activityLogs.actor', 'name email role')
      .sort({ eventDateTime: 1 });

    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCateringQuote = async (req, res) => {
  try {
    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const context = resolveCanteenContext(req, requestDoc.canteen.toString());
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    if (!['requested', 'quoted'].includes(requestDoc.status)) {
      return res.status(400).json({ success: false, message: 'Quote can only be edited while request is requested or quoted.' });
    }

    const {
      packageId = null,
      lineItems = [],
      serviceFee = 0,
      discount = 0,
      validUntil = null,
      notes = '',
      estimatedPrepMinutes = requestDoc.estimatedPrepMinutes,
    } = req.body;

    const quoteValidation = validateQuotePayload({
      lineItems,
      serviceFee,
      discount,
      validUntil,
      estimatedPrepMinutes,
      packageId,
    });
    if (quoteValidation.errors.length) {
      return res.status(400).json({ success: false, message: quoteValidation.errors[0], errors: quoteValidation.errors });
    }

    let packageName = '';
    if (packageId) {
      const pkg = await EventCateringPackage.findById(packageId);
      if (!pkg || !pkg.isActive) {
        return res.status(404).json({ success: false, message: 'Selected package not found.' });
      }
      packageName = pkg.name;
      requestDoc.quote.packageId = pkg._id;
      requestDoc.quote.packageName = pkg.name;
      requestDoc.estimatedPrepMinutes = pkg.estimatedPrepMinutes || estimatedPrepMinutes;
    } else {
      requestDoc.quote.packageId = null;
      requestDoc.quote.packageName = '';
      requestDoc.estimatedPrepMinutes = estimatedPrepMinutes;
    }

    const normalizedLineItems = Array.isArray(lineItems)
      ? lineItems.map((item) => ({
          name: String(item.name || '').trim(),
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          notes: String(item.notes || '').trim(),
        })).filter((item) => item.name && item.quantity > 0)
      : [];

    const totals = calcQuoteTotals(normalizedLineItems, serviceFee, discount);
    if (totals.totalQuoted <= 0) {
      return res.status(400).json({ success: false, message: 'Quoted total must be greater than 0.' });
    }
    requestDoc.quote.lineItems = normalizedLineItems;
    requestDoc.quote.subtotal = totals.subtotal;
    requestDoc.quote.serviceFee = Number(serviceFee || 0);
    requestDoc.quote.discount = Number(discount || 0);
    requestDoc.quote.fullPaymentDiscount = 0;
    requestDoc.quote.installmentInterestRate = 0;
    requestDoc.quote.totalQuoted = totals.totalQuoted;
    requestDoc.quote.validUntil = validUntil ? new Date(validUntil) : null;
    requestDoc.quote.notes = notes;
    requestDoc.quote.preparedBy = req.user._id;
    requestDoc.quote.preparedAt = new Date();

    const activeTotalPayable = resolveActiveTotalPayable(requestDoc);
    requestDoc.payment.totalPayable = activeTotalPayable;
    requestDoc.payment.amountDue = Math.max(0, activeTotalPayable - Number(requestDoc.payment.amountPaid || 0));
    if (requestDoc.payment.amountPaid >= activeTotalPayable && activeTotalPayable > 0) {
      requestDoc.payment.status = 'paid';
    } else if (requestDoc.payment.amountPaid > 0) {
      requestDoc.payment.status = 'partial';
    } else {
      requestDoc.payment.status = 'pending';
    }

    requestDoc.status = 'quoted';

    appendActivity(requestDoc, {
      action: 'quote_updated',
      actor: req.user._id,
      actorRole: req.user.role,
      note: packageName ? `Quote updated using package "${packageName}".` : 'Quote updated with custom line items.',
      metadata: { totalQuoted: requestDoc.quote.totalQuoted },
    });

    await requestDoc.save();

    const notifyDoc = await EventCateringRequest.findById(requestDoc._id)
      .populate('requester', 'email')
      .populate('canteen', 'name');
    sendCateringStatusEmail({
      email: notifyDoc?.requester?.email,
      eventName: requestDoc.eventName,
      status: 'quoted',
      quoteTotal: requestDoc.quote.totalQuoted,
      canteenName: notifyDoc?.canteen?.name,
      note: requestDoc.quote.notes,
    }).catch((error) => console.error('Failed to send catering quote notification:', error.message));

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEventCateringStatus = async (req, res) => {
  try {
    const { status, reason = '' } = req.body;
    if (!REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const context = resolveCanteenContext(req, requestDoc.canteen.toString());
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    const allowedNext = transitionMap[requestDoc.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${requestDoc.status} to ${status}.`,
      });
    }

    if (status === 'in_prep') {
      if (requestDoc.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Request must be approved before preparation.' });
      }
      if (requestDoc.payment?.status !== 'paid') {
        return res.status(400).json({ success: false, message: 'Payment must be marked as paid before preparation.' });
      }
      const { prepStart } = await assertCapacity({
        canteenId: requestDoc.canteen,
        eventDateTime: requestDoc.eventDateTime,
        estimatedPrepMinutes: requestDoc.estimatedPrepMinutes,
        ignoreRequestId: requestDoc._id,
      });
      requestDoc.prepStartAt = prepStart;
      requestDoc.capacitySlotKey = `${requestDoc.canteen.toString()}_${prepStart.toISOString().slice(0, 13)}`;
    }

    const previous = requestDoc.status;
    requestDoc.status = status;

    appendActivity(requestDoc, {
      action: 'status_updated',
      actor: req.user._id,
      actorRole: req.user.role,
      note: reason
        ? `Status changed from ${previous} to ${status}. Reason: ${reason}`
        : `Status changed from ${previous} to ${status}.`,
      metadata: { previousStatus: previous, newStatus: status, reason },
    });

    await requestDoc.save();

    const notifyDoc = await EventCateringRequest.findById(requestDoc._id)
      .populate('requester', 'email')
      .populate('canteen', 'name');
    sendCateringStatusEmail({
      email: notifyDoc?.requester?.email,
      eventName: requestDoc.eventName,
      status,
      quoteTotal: requestDoc.quote?.totalQuoted,
      canteenName: notifyDoc?.canteen?.name,
      note: reason || '',
    }).catch((error) => console.error('Failed to send catering status notification:', error.message));

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const updateEventCateringPayment = async (req, res) => {
  try {
    const {
      amountPaid,
      status,
      preferredMethod,
      transactionRef = '',
      notes = '',
    } = req.body;

    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const context = resolveCanteenContext(req, requestDoc.canteen.toString());
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    if (preferredMethod) {
      if (!ALLOWED_PAYMENT_METHODS.includes(preferredMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid preferred payment method.' });
      }
      requestDoc.payment.preferredMethod = preferredMethod;
    }

    if (amountPaid != null) {
      const safeAmountPaid = Number(amountPaid || 0);
      if (safeAmountPaid < 0 || Number.isNaN(safeAmountPaid)) {
        return res.status(400).json({ success: false, message: 'amountPaid must be a non-negative number.' });
      }
      requestDoc.payment.amountPaid = safeAmountPaid;
    }

    const quotedTotal = Number(requestDoc.quote?.totalQuoted || 0);
    requestDoc.payment.amountDue = Math.max(0, quotedTotal - Number(requestDoc.payment.amountPaid || 0));

    if (status) {
      if (!ALLOWED_PAYMENT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid payment status.' });
      }
      requestDoc.payment.status = status;
    } else if (requestDoc.payment.amountDue <= 0 && quotedTotal > 0) {
      requestDoc.payment.status = 'paid';
    } else if (requestDoc.payment.amountPaid > 0) {
      requestDoc.payment.status = 'partial';
    } else {
      requestDoc.payment.status = 'pending';
    }

    requestDoc.payment.transactionRef = String(transactionRef || '').trim();
    requestDoc.payment.notes = String(notes || '').trim();
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    if (requestDoc.payment.status === 'paid' && requestDoc.payment.amountDue > 0) {
      return res.status(400).json({ success: false, message: 'Cannot mark payment as paid while amount due is greater than 0.' });
    }

    appendActivity(requestDoc, {
      action: 'payment_updated',
      actor: req.user._id,
      actorRole: req.user.role,
      note: `Payment updated to ${requestDoc.payment.status}.`,
      metadata: {
        amountPaid: requestDoc.payment.amountPaid,
        amountDue: requestDoc.payment.amountDue,
        preferredMethod: requestDoc.payment.preferredMethod,
        transactionRef: requestDoc.payment.transactionRef,
      },
    });

    await requestDoc.save();

    const notifyDoc = await EventCateringRequest.findById(requestDoc._id)
      .populate('requester', 'email')
      .populate('canteen', 'name');
    sendCateringStatusEmail({
      email: notifyDoc?.requester?.email,
      eventName: requestDoc.eventName,
      status: `payment_${requestDoc.payment.status}`,
      quoteTotal: requestDoc.quote?.totalQuoted,
      canteenName: notifyDoc?.canteen?.name,
      note: requestDoc.payment.notes,
    }).catch((error) => console.error('Failed to send catering payment notification:', error.message));

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createEventCateringPaymentPortal = async (req, res) => {
  try {
    const requestDoc = await EventCateringRequest.findById(req.params.requestId).populate('canteen', 'name');
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!['quoted', 'approved', 'in_prep', 'ready'].includes(requestDoc.status)) {
      return res.status(400).json({ success: false, message: 'Payment portal is available after quote/approval.' });
    }
    if ((requestDoc.payment?.status || '') === 'paid') {
      return res.status(400).json({ success: false, message: 'Request is already fully paid.' });
    }

    const amount = Math.round(Number(requestDoc.quote?.totalQuoted || 0) * 100);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Quote amount is not available yet.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'lkr',
            product_data: {
              name: `Event Catering - ${requestDoc.eventName}`,
              description: `${requestDoc.canteen?.name || 'Canteen'} · ${requestDoc.headcount} pax`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventCateringRequestId: requestDoc._id.toString(),
        requesterId: req.user._id.toString(),
      },
      success_url: `${frontendUrl}/dashboard/event-catering/payment/${requestDoc._id}?portalSuccess=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard/event-catering/payment/${requestDoc._id}?portalCancelled=1`,
    });

    requestDoc.payment.preferredMethod = 'card';
    requestDoc.payment.portalSessionId = session.id;
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_portal_created',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Student opened card payment portal.',
      metadata: { sessionId: session.id },
    });

    await requestDoc.save();

    return res.json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createEventCateringStripeIntent = async (req, res) => {
  try {
    const requestDoc = await EventCateringRequest.findById(req.params.requestId).populate('canteen', 'name');
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!['quoted', 'approved', 'in_prep', 'ready'].includes(requestDoc.status)) {
      return res.status(400).json({ success: false, message: 'Card payment is available after quote/approval.' });
    }

    if ((requestDoc.payment?.status || '') === 'paid') {
      return res.status(400).json({ success: false, message: 'Request is already fully paid.' });
    }

    const amount = Math.round(Number(requestDoc.quote?.totalQuoted || 0) * 100);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Quote amount is not available yet.' });
    }

    let paymentIntent = null;
    const existingIntentId = String(requestDoc.payment?.portalPaymentIntentId || '').trim();

    if (existingIntentId) {
      try {
        const existingIntent = await getStripe().paymentIntents.retrieve(existingIntentId);
        if (existingIntent && ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(existingIntent.status)) {
          paymentIntent = existingIntent;
        }
      } catch (_err) {
        paymentIntent = null;
      }
    }

    if (!paymentIntent) {
      paymentIntent = await getStripe().paymentIntents.create({
        amount,
        currency: process.env.STRIPE_CURRENCY || 'lkr',
        metadata: {
          eventCateringRequestId: requestDoc._id.toString(),
          requesterId: req.user._id.toString(),
        },
      });
    }

    requestDoc.payment.preferredMethod = 'card';
    requestDoc.payment.portalPaymentIntentId = String(paymentIntent.id || '');
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_intent_created',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Student initiated in-app Stripe card payment.',
      metadata: { paymentIntentId: paymentIntent.id },
    });

    await requestDoc.save();

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const confirmEventCateringStripePayment = async (req, res) => {
  try {
    const { paymentIntentId = '' } = req.body || {};

    const requestDoc = await EventCateringRequest.findById(req.params.requestId).populate('canteen', 'name');
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const resolvedIntentId = String(paymentIntentId || requestDoc.payment?.portalPaymentIntentId || '').trim();
    if (!resolvedIntentId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId is required.' });
    }

    const intent = await getStripe().paymentIntents.retrieve(resolvedIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment is not completed yet.' });
    }
    if (intent?.metadata?.eventCateringRequestId && intent.metadata.eventCateringRequestId !== requestDoc._id.toString()) {
      return res.status(400).json({ success: false, message: 'Payment intent does not belong to this request.' });
    }

    requestDoc.payment.preferredMethod = 'card';
    requestDoc.payment.portalPaymentIntentId = String(intent.id || '');
    requestDoc.payment.amountPaid = Number(requestDoc.quote?.totalQuoted || 0);
    requestDoc.payment.amountDue = 0;
    requestDoc.payment.status = 'paid';
    requestDoc.payment.transactionRef = String(intent.id || '');
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_verified',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'In-app Stripe card payment confirmed.',
      metadata: { paymentIntentId: intent.id },
    });

    await requestDoc.save();
    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const confirmEventCateringPaymentPortal = async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required.' });
    }

    const requestDoc = await EventCateringRequest.findById(req.params.requestId).populate('canteen', 'name');
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is not completed yet.' });
    }
    if (session?.metadata?.eventCateringRequestId && session.metadata.eventCateringRequestId !== requestDoc._id.toString()) {
      return res.status(400).json({ success: false, message: 'Payment session does not belong to this request.' });
    }

    requestDoc.payment.preferredMethod = 'card';
    requestDoc.payment.portalSessionId = session.id;
    requestDoc.payment.portalPaymentIntentId = String(session.payment_intent || '');
    requestDoc.payment.amountPaid = Number(requestDoc.quote?.totalQuoted || 0);
    requestDoc.payment.amountDue = 0;
    requestDoc.payment.status = 'paid';
    requestDoc.payment.transactionRef = String(session.payment_intent || '');
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_portal_confirmed',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Card payment confirmed from portal.',
      metadata: { sessionId: session.id, paymentIntentId: session.payment_intent },
    });

    await requestDoc.save();

    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadEventCateringPaymentReceipt = async (req, res) => {
  try {
    const { transactionRef = '', method = '', notes = '', paidAmount = 0, paymentPlan = 'full' } = req.body || {};
    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (!isRequester(requestDoc, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Receipt file is required.' });
    }
    if (!ALLOWED_PAYMENT_METHODS.includes(String(method || requestDoc.payment.preferredMethod || 'cash'))) {
      return res.status(400).json({ success: false, message: 'Invalid payment method for receipt upload.' });
    }

    const options = computeQuotePayableOptions(requestDoc);
    if (!options.quotedTotal || options.quotedTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Quote amount is not available yet.' });
    }

    if (String(requestDoc.payment?.pendingStatus || 'none') === 'pending') {
      return res.status(409).json({ success: false, message: 'A payment proof is already pending verification.' });
    }

    const normalizedPaidAmount = Number(paidAmount || 0);
    if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount <= 0) {
      return res.status(400).json({ success: false, message: 'paidAmount must be a positive number.' });
    }

    const selectedPlan = String(paymentPlan || 'full');
    const resolvedPlanMode = selectedPlan === 'full' ? 'full' : 'installment';

    if (requestDoc.payment?.planMode && requestDoc.payment.planMode !== 'none' && requestDoc.payment.planMode !== resolvedPlanMode) {
      return res.status(400).json({ success: false, message: 'Payment plan cannot be switched after first submission.' });
    }

    const totalPayable = options.quotedTotal;
    const existingPaid = Number(requestDoc.payment.amountPaid || 0);
    const existingDue = Math.max(0, totalPayable - existingPaid);
    const expectedPaidAmount = selectedPlan === 'full'
      ? totalPayable
      : selectedPlan === 'half'
        ? options.halfPaymentTotal
        : selectedPlan === 'three_quarter'
          ? options.threeQuarterPaymentTotal
          : null;

    if (expectedPaidAmount == null) {
      return res.status(400).json({ success: false, message: 'Invalid payment plan selected.' });
    }

    if (Math.abs(normalizedPaidAmount - expectedPaidAmount) > 0.01) {
      return res.status(400).json({ success: false, message: 'paidAmount must match the selected payment plan amount.' });
    }

    const normalizedPaymentPlan = ['full', 'half', 'three_quarter'].includes(selectedPlan)
      ? selectedPlan
      : 'full';

    requestDoc.payment.receiptFileUrl = `/uploads/${req.file.filename}`;
    requestDoc.payment.receiptUploadedAt = new Date();
    requestDoc.payment.receiptUploadedBy = req.user._id;
    requestDoc.payment.planMode = resolvedPlanMode;
    requestDoc.payment.totalPayable = totalPayable;
    requestDoc.payment.pendingAmount = normalizedPaidAmount;
    requestDoc.payment.pendingPlan = normalizedPaymentPlan;
    requestDoc.payment.pendingStatus = 'pending';
    requestDoc.payment.pendingSubmittedAt = new Date();
    requestDoc.payment.amountDue = existingDue;
    requestDoc.payment.transactionRef = String(transactionRef || '').trim();
    requestDoc.payment.notes = String(notes || '').trim();
    if (method) requestDoc.payment.preferredMethod = method;
    if (requestDoc.payment.status === 'pending') requestDoc.payment.status = 'pending';
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_receipt_uploaded',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Student uploaded payment receipt for staff verification.',
      metadata: {
        receiptFileUrl: requestDoc.payment.receiptFileUrl,
        method: requestDoc.payment.preferredMethod,
        paymentPlan: normalizedPaymentPlan,
        paidAmountSubmitted: normalizedPaidAmount,
        verifiedPaid: requestDoc.payment.amountPaid,
        remainingDueBeforeVerification: requestDoc.payment.amountDue,
        totalPayable,
      },
    });

    await requestDoc.save();
    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyEventCateringPaymentSubmission = async (req, res) => {
  try {
    const { action = 'approve', reason = '' } = req.body || {};
    const requestDoc = await EventCateringRequest.findById(req.params.requestId);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const context = resolveCanteenContext(req, requestDoc.canteen.toString());
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    if (String(requestDoc.payment?.pendingStatus || 'none') !== 'pending' || Number(requestDoc.payment?.pendingAmount || 0) <= 0) {
      return res.status(400).json({ success: false, message: 'No pending student payment proof to verify.' });
    }

    const pendingAmount = Number(requestDoc.payment.pendingAmount || 0);
    const verifiedPaid = Number(requestDoc.payment.amountPaid || 0);
    const totalPayable = Number(requestDoc.payment.totalPayable || resolveActiveTotalPayable(requestDoc));

    if (action === 'reject') {
      requestDoc.payment.pendingStatus = 'rejected';
      requestDoc.payment.pendingAmount = 0;
      requestDoc.payment.pendingPlan = 'none';
      requestDoc.payment.pendingSubmittedAt = null;
      requestDoc.payment.updatedBy = req.user._id;
      requestDoc.payment.updatedAt = new Date();

      appendActivity(requestDoc, {
        action: 'payment_verification_rejected',
        actor: req.user._id,
        actorRole: req.user.role,
        note: reason ? `Student payment proof rejected. ${reason}` : 'Student payment proof rejected.',
      });

      await requestDoc.save();
      return res.json({ success: true, data: requestDoc });
    }

    const nextPaid = verifiedPaid + pendingAmount;
    requestDoc.payment.amountPaid = nextPaid;
    requestDoc.payment.totalPayable = totalPayable;
    requestDoc.payment.amountDue = Math.max(0, totalPayable - nextPaid);
    requestDoc.payment.status = requestDoc.payment.amountDue <= 0 ? 'paid' : 'partial';
    requestDoc.payment.pendingStatus = 'none';
    requestDoc.payment.pendingAmount = 0;
    requestDoc.payment.pendingPlan = 'none';
    requestDoc.payment.pendingSubmittedAt = null;
    requestDoc.payment.updatedBy = req.user._id;
    requestDoc.payment.updatedAt = new Date();

    appendActivity(requestDoc, {
      action: 'payment_verified',
      actor: req.user._id,
      actorRole: req.user.role,
      note: reason
        ? `Staff verified student payment proof for LKR ${pendingAmount.toLocaleString()}. ${reason}`
        : `Staff verified student payment proof for LKR ${pendingAmount.toLocaleString()}.`,
      metadata: {
        verifiedAmount: pendingAmount,
        cumulativePaid: requestDoc.payment.amountPaid,
        remainingDue: requestDoc.payment.amountDue,
      },
    });

    await requestDoc.save();
    return res.json({ success: true, data: requestDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createCateringPackage = async (req, res) => {
  try {
    const { name, description, minHeadcount, maxHeadcount, basePrice, estimatedPrepMinutes, items = [] } = req.body;
    if (!name || basePrice == null) {
      return res.status(400).json({ success: false, message: 'name and basePrice are required.' });
    }

    const context = resolveCanteenContext(req);
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    const pkg = await EventCateringPackage.create({
      canteen: context.canteenId,
      name,
      description,
      minHeadcount,
      maxHeadcount,
      basePrice,
      estimatedPrepMinutes,
      items,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCateringPackages = async (req, res) => {
  try {
    const requestedCanteenId = req.query?.canteen || null;
    const assignedCanteenId = req.user?.canteen ? req.user.canteen.toString() : null;
    const canteenId = requestedCanteenId || assignedCanteenId;

    if (!canteenId) {
      return res.status(400).json({ success: false, message: 'canteen query is required.' });
    }

    const filter = { canteen: canteenId };
    if (req.query.includeInactive !== 'true') {
      filter.isActive = true;
    }

    const packages = await EventCateringPackage.find(filter)
      .sort({ name: 1 })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCateringPackage = async (req, res) => {
  try {
    const pkg = await EventCateringPackage.findById(req.params.packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const context = resolveCanteenContext(req, pkg.canteen.toString());
    if (!context.ok) {
      return res.status(context.status).json({ success: false, code: context.code, message: context.message });
    }

    const updates = ['name', 'description', 'minHeadcount', 'maxHeadcount', 'basePrice', 'estimatedPrepMinutes', 'items', 'isActive'];
    for (const field of updates) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        pkg[field] = req.body[field];
      }
    }
    pkg.updatedBy = req.user._id;
    await pkg.save();

    return res.json({ success: true, data: pkg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
