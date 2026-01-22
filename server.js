require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

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
app.use(express.static(path.join(__dirname)));

// Subscribe endpoint
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Send Welcome Email to the subscriber
        const { data, error } = await resend.emails.send({
            from: 'Williams from Kloutbox <danielonikola@kloutbox.com>',
            to: [email],
            subject: 'Welcome to Kloutbox! 🎉',
            html: `
                <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; background-color:#f9f5ef; color:#1f1f1f; padding:32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,0.06);">
                        <tr>
                            <td style="padding:28px 32px; border-bottom:1px solid #f0e9de; font-weight:700;">Kloutbox</td>
                        </tr>
                        <tr>
                            <td style="padding:32px;">
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">At KloutBox, we tell stories that feel familiar, even when they aren’t yours. Stories about love that didn’t survive. Faith that complicated things. Growth that costs something. Choosing yourself when everyone expected you to stay.</p>
                                <p style="margin:0 0 10px 0; font-size:16px; line-height:1.7;">We don’t chase trends.</p>
                                <p style="margin:0 0 10px 0; font-size:16px; line-height:1.7;">We don’t preach.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">We don’t perform.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">We listen. We write. We leave space.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">Every now and then, we’ll send you a story. One that sits quietly with you. One that might make you pause. One that reminds you that you’re not strange for feeling the way you do, you’re human.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">That’s all we promise.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">Thanks for finding your way here.</p>
                                <p style="margin:0 0 18px 0; font-size:16px; line-height:1.7;">You’re in good company.</p>
                                <p style="margin:0 0 24px 0; font-size:16px; line-height:1.7;">Cheers.</p>
                                <p style="margin:0; font-size:16px; line-height:1.7; font-weight:700;">Williams.</p>
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
                from: 'Williams from Kloutbox <danielonikola@kloutbox.com>',
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

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
