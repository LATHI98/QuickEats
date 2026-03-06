import GroupSession from '../models/GroupSession.model.js';

// Random 6 character alphanumeric code
const generateShareCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// GET /api/group-sessions/my/active
export const getActiveSession = async (req, res) => {
    try {
        const session = await GroupSession.findOne({
            members: req.user._id,
            status: { $in: ['open', 'locked'] }
        }).populate('creator', 'name username').populate('members', 'name username');

        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/group-sessions  { canteenId, paymentMode }
export const createSession = async (req, res) => {
    try {
        const { canteenId, paymentMode } = req.body;
        if (!canteenId) return res.status(400).json({ success: false, message: 'canteenId is required' });

        // Ensure user doesn't have an active open session already
        const existing = await GroupSession.findOne({ creator: req.user._id, status: 'open' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have an open session. Please lock or complete it first.', data: existing });
        }

        const shareCode = generateShareCode();

        let pm = paymentMode || 'pay_separately';
        if (!['pay_separately', 'pay_together'].includes(pm)) pm = 'pay_separately';

        const session = await GroupSession.create({
            creator: req.user._id,
            canteen: canteenId,
            shareCode,
            members: [req.user._id],
            paymentMode: pm,
        });

        res.status(201).json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/group-sessions/join  { shareCode }
export const joinSession = async (req, res) => {
    try {
        const { shareCode } = req.body;
        if (!shareCode) return res.status(400).json({ success: false, message: 'shareCode is required' });

        const session = await GroupSession.findOne({ shareCode: shareCode.toUpperCase() });
        if (!session) return res.status(404).json({ success: false, message: 'Invalid share code or session not found' });

        if (session.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This session is no longer open for joining' });
        }

        // Add if not already a member
        if (!session.members.includes(req.user._id)) {
            session.members.push(req.user._id);
            await session.save();
        }

        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/group-sessions/:id
export const getSession = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id)
            .populate('creator', 'name username email')
            .populate('members', 'name username email')
            .populate('canteen', 'name');

        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        // Check if user is part of the session
        const isMember = session.members.some(m => m._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'You are not a member of this session' });
        }

        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/group-sessions/:id/lock
export const lockSession = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        if (session.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the creator can lock the session' });
        }

        if (session.status !== 'open') {
            return res.status(400).json({ success: false, message: `Session is already ${session.status}` });
        }

        session.status = 'locked';
        await session.save();

        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
