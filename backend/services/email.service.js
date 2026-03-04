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
