import mongoose from 'mongoose';
import GroupSession from './models/GroupSession.model.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

async function testSwitching() {
    try {
        await mongoose.connect(process.env.MONGODBURL);
        console.log('Connected to MongoDB');

        const studentEmail = 'student@quickeats.com'; // Use the test student
        const student = await User.findOne({ email: studentEmail });
        if (!student) throw new Error('Student not found');

        // 1. Create Session A
        const sessionA = await GroupSession.create({
            creator: student._id,
            canteen: new mongoose.Types.ObjectId(), // dummy
            shareCode: 'SESSA',
            members: [student._id],
            status: 'open',
            name: 'Session A'
        });
        console.log('Created Session A:', sessionA.shareCode);

        // 2. Create Session B
        const sessionB = await GroupSession.create({
            creator: new mongoose.Types.ObjectId(), // different creator
            canteen: new mongoose.Types.ObjectId(),
            shareCode: 'SESSB',
            members: [],
            status: 'open',
            name: 'Session B'
        });
        console.log('Created Session B:', sessionB.shareCode);

        // 3. Mock the join logic (or call the API if we had a way, but we'll simulate the controller's logic)
        console.log('Simulating student joining Session B...');
        
        // --- START CONTROLLER LOGIC SIMULATION ---
        // Leave any other active sessions
        await GroupSession.updateMany(
            { members: student._id, status: { $in: ['open', 'locked'] }, shareCode: { $ne: sessionB.shareCode } },
            { $pull: { members: student._id } }
        );

        // Add to new session
        const targetSession = await GroupSession.findOne({ shareCode: sessionB.shareCode });
        targetSession.members.push(student._id);
        await targetSession.save();
        // --- END CONTROLLER LOGIC SIMULATION ---

        // 4. Verify
        const updatedA = await GroupSession.findById(sessionA._id);
        const updatedB = await GroupSession.findById(sessionB._id);

        console.log('Session A members:', updatedA.members.length);
        console.log('Session B members:', updatedB.members.length);

        if (updatedA.members.length === 0 && updatedB.members.some(m => m.toString() === student._id.toString())) {
            console.log('SUCCESS: Student automatically left Session A and joined Session B');
        } else {
            console.log('FAILURE: Student still in Session A or not in Session B');
        }

        // Cleanup
        await GroupSession.deleteOne({ _id: sessionA._id });
        await GroupSession.deleteOne({ _id: sessionB._id });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testSwitching();
