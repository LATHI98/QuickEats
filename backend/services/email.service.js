import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use your SMTP settings
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, token) => {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // For development, if process.env.EMAIL_USER is not set, we just log it
    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: Verify your QuickEats account`);
        console.log(`Link: ${url}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject: 'Verify your QuickEats account',
        html: `<p>Please click the link below to verify your account:</p><a href="${url}">${url}</a>`,
    });
};

export const sendOTPEmail = async (email, otp) => {
    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: Password Reset OTP`);
        console.log(`OTP: ${otp}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject: 'Your Password Reset OTP',
        html: `<p>Your password reset OTP is: <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    });
};
export const sendCancellationEmail = async (email, order, reason = '') => {
    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: Your QuickEats order #${order.queueNumber} has been cancelled`);
        console.log(`Reason: ${reason || 'Not specified'}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject: `Your QuickEats order #${order.queueNumber} has been cancelled`,
        html: `
            <h3>Order Cancelled</h3>
            <p>We're sorry, but your order <b>#${order.queueNumber}</b> from <b>${order.canteen?.name || 'the canteen'}</b> has been cancelled.</p>
            ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
            <p>If you have already paid, any pending transactions will be handled according to our refund policy. You can place a new order by visiting the app.</p>
            <p>Thank you,<br/>QuickEats Team</p>
        `,
    });
};

export const sendCateringStatusEmail = async ({ email, eventName, status, quoteTotal = null, canteenName = 'the canteen', note = '' }) => {
    if (!email) return;

    const subject = `QuickEats Catering Update: ${eventName} is now ${status}`;
    const quoteLine = quoteTotal != null ? `<p><b>Latest Quote:</b> LKR ${Number(quoteTotal).toLocaleString()}</p>` : '';
    const noteLine = note ? `<p><b>Note:</b> ${note}</p>` : '';

    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Event: ${eventName}`);
        console.log(`Status: ${status}`);
        if (quoteTotal != null) console.log(`Quote: LKR ${Number(quoteTotal).toLocaleString()}`);
        if (note) console.log(`Note: ${note}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject,
        html: `
            <h3>Catering Request Update</h3>
            <p>Your event <b>${eventName}</b> at <b>${canteenName}</b> has been updated.</p>
            <p><b>Status:</b> ${status}</p>
            ${quoteLine}
            ${noteLine}
            <p>Open QuickEats to view full request details.</p>
            <p>Thank you,<br/>QuickEats Team</p>
        `,
    });
};

export const sendSupportTicketCreatedEmail = async (email, ticket) => {
    if (!email || !ticket) return;

    const subject = `QuickEats Support Ticket Created: ${ticket.subject}`;

    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Ticket: ${ticket._id}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject,
        html: `
            <h3>Support Ticket Created</h3>
            <p>Your ticket <b>${ticket.subject}</b> has been created.</p>
            <p><b>Status:</b> ${ticket.status}</p>
            <p><b>Category:</b> ${ticket.category}</p>
            <p>We will update you in the app as soon as a support agent responds.</p>
        `,
    });
};

export const sendSupportTicketReplyEmail = async (email, ticket, replyText = '') => {
    if (!email || !ticket) return;

    const subject = `QuickEats Support Reply: ${ticket.subject}`;

    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Reply: ${replyText}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: email,
        subject,
        html: `
            <h3>Support Ticket Reply</h3>
            <p>Your ticket <b>${ticket.subject}</b> has a new reply.</p>
            ${replyText ? `<p><b>Reply:</b> ${replyText}</p>` : ''}
            <p>Open QuickEats to continue the conversation.</p>
        `,
    });
};

export const sendSupportTicketResolvedEmail = async (ticket, actor = null) => {
    const requesterEmail = ticket?.requester?.email || ticket?.requesterEmail || null;
    if (!requesterEmail || !ticket) return;

    const subject = `QuickEats Support Ticket Resolved: ${ticket.subject}`;

    if (!process.env.EMAIL_USER) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${requesterEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`ResolvedBy: ${actor?.email || 'system'}`);
        console.log('------------------');
        return;
    }

    await transporter.sendMail({
        from: '"QuickEats" <noreply@quickeats.com>',
        to: requesterEmail,
        subject,
        html: `
            <h3>Support Ticket Resolved</h3>
            <p>Your ticket <b>${ticket.subject}</b> is now <b>${ticket.status}</b>.</p>
            <p>If you still need help, reply in the app and we will reopen the conversation.</p>
        `,
    });
};
