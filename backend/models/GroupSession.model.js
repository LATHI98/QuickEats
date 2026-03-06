import mongoose from 'mongoose';

const groupSessionSchema = new mongoose.Schema(
    {
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        shareCode: { type: String, required: true, unique: true },
        paymentMode: {
            type: String,
            enum: ['pay_separately', 'pay_together'],
            default: 'pay_separately'
        },
        status: {
            type: String,
            enum: ['open', 'locked', 'completed'],
            default: 'open',
        },
    },
    { timestamps: true }
);

const GroupSession = mongoose.model('GroupSession', groupSessionSchema);
export default GroupSession;
