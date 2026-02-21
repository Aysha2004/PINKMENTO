const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Middleware: verify JWT ───────────────────────────────────────────────────
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// ─── Helper: check and apply beginner expiry ─────────────────────────────────
// REMOVED in favor of user.checkAndUpgrade() instance method on User model.

// ─── POST /auth/google ────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Google token is required' });
    }

    try {
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, name, email, picture: photo } = payload;

        // Find or create user — keyed by email (one user per email)
        let user = await User.findOne({ email });

        if (!user) {
            // New user — set beginnerExpiry to 30 days from now
            const now = new Date();
            const beginnerExpiry = new Date(now);
            beginnerExpiry.setDate(beginnerExpiry.getDate() + 30);

            user = await User.create({
                googleId,
                name,
                email,
                photo,
                role: 'beginner',
                coins: 0,
                beginnerCredits: 3,
                reputation: 0,
                sessionsTaught: 0,
                sessionsLearned: 0,
                createdAt: now,
                beginnerExpiry,
            });
        }

        // Check upgrade conditions on every login
        await user.checkAndUpgrade();

        // Generate JWT
        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user,
        });
    } catch (err) {
        console.error('Google auth error:', err.message);
        res.status(401).json({ message: 'Google token verification failed' });
    }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Protected route — returns the logged-in user's data.
// Also checks and applies beginner expiry on every call.
router.get('/me', verifyJWT, async (req, res) => {
    try {
        let user = await User.findById(req.userId).select('-__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check upgrade conditions on every /me call too
        await user.checkAndUpgrade();

        res.status(200).json({ user });
    } catch (err) {
        console.error('Fetch user error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
