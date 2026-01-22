require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();

// Initialize Resend with API Key
const resendApiKey = 're_17M3e9zr_KLRAiRA61EKDXC5jkrXnSNEc';
if (!resendApiKey) {
    console.warn('WARNING: RESEND_API_KEY is missing. Email sending will fail.');
}
const resend = new Resend(resendApiKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Subscribe endpoint
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Send Welcome Email to the subscriber
        const { data, error } = await resend.emails.send({
            from: 'Kloutbox <danielonikola@kloutbox.com>',
            to: [email],
            subject: 'Welcome to Kloutbox! 🎉',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; background-color:#f9f5ef; color:#1f1f1f; padding:32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,0.06);">
                        <tr>
                            <td style="padding:28px 32px; border-bottom:1px solid #f0e9de;">
                                <div style="font-size:20px; font-weight:700; letter-spacing:.2px;">Kloutbox</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px;">
                                <h1 style="margin:0 0 12px 0; font-size:28px; line-height:1.25;">Welcome to the chatty corner of the internet 👋</h1>
                                <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">We’re thrilled to have you. You’ll receive thoughtfully curated stories, trends, and talkouts — crafted to spark conversations and help brands build experiences people remember.</p>
                                <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">As a subscriber, expect regular updates, behind‑the‑scenes notes, and highlights from our community. If you ever want to revisit us, you can always find us at <a href="https://www.kloutbox.com" style="color:#d74c2f; text-decoration:none; font-weight:600;">kloutbox.com</a>.</p>
                                <div style="margin:24px 0;">
                                    <a href="https://www.kloutbox.com" style="display:inline-block; background:#d74c2f; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">Explore Kloutbox</a>
                                </div>
                                <p style="margin:0; font-size:14px; color:#5b5b5b; line-height:1.6;">If this wasn’t you, simply ignore this email. No action is required.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:20px 32px; border-top:1px solid #f0e9de; font-size:13px; color:#6a6a6a;">
                                Sent by Kloutbox • <a href="https://www.kloutbox.com" style="color:#d74c2f; text-decoration:none;">kloutbox.com</a>
                            </td>
                        </tr>
                    </table>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Email sent successfully:', data);

        // 2. Notify admin (danielonikola@kloutbox.com)
        try {
            await resend.emails.send({
                from: 'Kloutbox <danielonikola@kloutbox.com>',
                to: ['danielonikola@kloutbox.com'],
                subject: 'New Kloutbox Subscriber',
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">
                        <p style="font-size:16px;">A new subscriber just joined the list:</p>
                        <p style="font-size:18px; font-weight:700;">${email}</p>
                        <p style="font-size:14px; color:#666;">Timestamp: ${new Date().toISOString()}</p>
                        <p><a href="https://www.kloutbox.com" style="color:#d74c2f; text-decoration:none; font-weight:600;">Visit kloutbox.com</a></p>
                    </div>
                `,
            });
        } catch (adminError) {
            console.error('Error sending admin notification:', adminError);
            // Don't fail the request if admin notification fails
        }

        res.status(200).json({ message: 'Subscribed successfully!' });
    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// For local development
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
