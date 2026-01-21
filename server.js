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
            from: 'Kloutbox <danielonikola@kloutbox.com>',
            to: [email],
            subject: 'Welcome to Kloutbox!',
            html: `
                <h1>Welcome to Kloutbox!</h1>
                <p>Thank you for subscribing to our newsletter. We are excited to have you on board!</p>
                <p>Stay tuned for updates on current happenings, trends, and talkouts.</p>
                <br>
                <p>Best regards,</p>
                <p>The Kloutbox Team</p>
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
                subject: 'New Subscriber!',
                html: `<p>New subscriber joined: <strong>${email}</strong></p>`,
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
