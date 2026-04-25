import GroupSession from '../models/GroupSession.model.js';
import QRCode from 'qrcode';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';

const getItemCanteenId = (item) => {
    if (!item) return null;
    if (item.canteen && typeof item.canteen === 'object' && item.canteen._id) return item.canteen._id.toString();
    if (item.canteen) return item.canteen.toString();
    if (item.menuItem && typeof item.menuItem === 'object' && item.menuItem.canteen) {
        const menuCanteen = item.menuItem.canteen;
        if (typeof menuCanteen === 'object' && menuCanteen._id) return menuCanteen._id.toString();
        return menuCanteen.toString();
    }
    return null;
};

const filterItemsByCanteen = (items = [], canteenId) => {
    const target = canteenId ? canteenId.toString() : null;
    return items.filter((item) => getItemCanteenId(item) === target);
};

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

// POST /api/group-sessions  { canteenId, paymentMode, name }
export const createSession = async (req, res) => {
    try {
        const { canteenId, paymentMode, name } = req.body;
        if (!canteenId) return res.status(400).json({ success: false, message: 'canteenId is required' });

        // Ensure user doesn't have an active open session already
        const existing = await GroupSession.findOne({ creator: req.user._id, status: 'open' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have an open session. Please lock or complete it first.', data: existing });
        }

        const shareCode = generateShareCode();

        let pm = paymentMode || 'pay_separately';
        if (!['pay_separately', 'pay_together'].includes(pm)) pm = 'pay_separately';

        let qrCodeData = null;
        try {
            qrCodeData = await QRCode.toDataURL(shareCode, {
                width: 220,
                margin: 1,
                color: { dark: '#4338ca', light: '#eef2ff' },
            });
        } catch (e) { console.error('QR generation failed', e); }

        const session = await GroupSession.create({
            creator: req.user._id,
            canteen: canteenId,
            shareCode,
            members: [req.user._id],
            paymentMode: pm,
            name: name || 'Group Order',
            qrCodeData
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
            return res.status(400).json({ success: false, message: `This session is ${session.status} and cannot be joined.` });
        }

        // 1. Leave any other active sessions before joining a new one
        await GroupSession.updateMany(
            { members: req.user._id, status: { $in: ['open', 'locked'] }, shareCode: { $ne: shareCode.toUpperCase() } },
            { $pull: { members: req.user._id } }
        );

        // 2. Add if not already a member
        const isAlreadyMember = session.members.some(m => m.toString() === req.user._id.toString());
        if (!isAlreadyMember) {
            session.members.push(req.user._id);
            await session.save();
        }

        res.json({ success: true, data: session });
    } catch (err) {
        console.error('Join session error:', err);
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

// PATCH /api/group-sessions/:id
export const editSession = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        if (session.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the creator can edit the session' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ success: false, message: `Cannot edit a ${session.status} session` });
        }

        // Only allow name edits if 'open'
        if (req.body.name) {
            if (session.status !== 'open') {
                return res.status(400).json({ success: false, message: 'Cannot edit group name after locking session' });
            }
            session.name = req.body.name;
        }
        if (req.body.paymentMode && ['pay_separately', 'pay_together'].includes(req.body.paymentMode)) {
            session.paymentMode = req.body.paymentMode;
        }

        await session.save();
        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// DELETE /api/group-sessions/:id/members/:memberId
export const removeMember = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const isCreator = session.creator.toString() === req.user._id.toString();
        const isSelf = req.params.memberId === req.user._id.toString();

        if (!isCreator && !isSelf) {
            return res.status(403).json({ success: false, message: 'Not authorized to remove this member' });
        }

        if (req.params.memberId === session.creator.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot remove the creator. Cancel the session instead.' });
        }

        if (session.status !== 'open') {
            return res.status(400).json({ success: false, message: `Cannot modify members in a ${session.status} session` });
        }

        session.members = session.members.filter(m => m.toString() !== req.params.memberId);
        await session.save();

        // Also clear their cart so they aren't accidentally ordering still
        await Cart.deleteOne({ student: req.params.memberId });

        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/group-sessions/:id
export const deleteSession = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        if (session.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the creator can cancel the session' });
        }

        if (session.status !== 'open') {
            return res.status(400).json({ success: false, message: `Cannot cancel a ${session.status} session` });
        }

        // Clear all members' carts to prevent stray items
        await Cart.deleteMany({ student: { $in: session.members } });

        await GroupSession.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Session cancelled successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/group-sessions/:id/merged-cart
export const getMergedCart = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const isMember = session.members.some(m => m.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: 'Not a member of this session' });
        }

        const memberCarts = await Cart.find({ student: { $in: session.members } });
        const allItems = [];
        memberCarts.forEach(c => allItems.push(...filterItemsByCanteen(c.items, session.canteen)));

        const totalPrice = allItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

        res.json({ success: true, data: { items: allItems, totalPrice } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// GET /api/group-sessions/:id/member-status
export const getMemberStatus = async (req, res) => {
    try {
        const session = await GroupSession.findById(req.params.id).populate('members', 'name username');
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const memberData = await Promise.all(session.members.map(async (m) => {
            const cart = await Cart.findOne({ student: m._id });
            const sessionItems = cart ? filterItemsByCanteen(cart.items, session.canteen) : [];
            return {
                _id: m._id,
                name: m.name,
                username: m.username,
                hasItems: sessionItems.length > 0,
                itemCount: sessionItems.length
            };
        }));

        res.json({ success: true, data: memberData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
