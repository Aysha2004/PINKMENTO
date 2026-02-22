const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const logFile = path.join(__dirname, '../../debug.log');
const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Middleware: verify JWT ───────────────────────────────────────────────────
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logToFile("AUTH ERROR: No token provided");
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        logToFile(`AUTH ERROR: Invalid or expired token - ${err.message}`);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// ─── POST /auth/google ────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Google token is required' });
    }

    try {
        logToFile(`Attempting Google login with token segment count: ${token.split('.').length}`);
        let googleId, name, email, photo;

        // Try verifying as ID Token first
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            googleId = payload.sub;
            name = payload.name;
            email = payload.email;
            photo = payload.picture;
        } catch (idErr) {
            // If ID Token verification fails, try as Access Token (starts with ya29.)
            console.log("Token is not a valid ID Token, trying as Access Token...");
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
            googleId = response.data.sub;
            name = response.data.name;
            email = response.data.email;
            photo = response.data.picture;
        }

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
        logToFile(`GOOGLE AUTH ERROR: ${err.message}`);
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

        // Welcome coins for new/testing users
        if (user.coins === 0 && user.sessionsLearned === 0 && user.sessionsTaught === 0) {
            user.coins = 10;
            await user.save();
        }

        res.status(200).json({ user });
    } catch (err) {
        console.error('Fetch user error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /auth/user/:id ──────────────────────────────────────────────────
// Returns public profile of another user.
router.get('/user/:id', verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name email photo role reputation bio sessionsTaught sessionsLearned skillsHave');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
