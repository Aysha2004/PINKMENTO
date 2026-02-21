const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// ─── GET /skills ──────────────────────────────────────────────────────────────
// Returns the logged-in user's skillsHave and skillsWant.
router.get('/', verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('skillsHave skillsWant');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ skillsHave: user.skillsHave, skillsWant: user.skillsWant });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /skills/have ────────────────────────────────────────────────────────
// Add a skill to skillsHave.
// Body: { name, level, proofLinks? }
// allowedToTeach is always false on creation — set by admin separately.
router.post('/have', verifyJWT, async (req, res) => {
    const { name, level, proofLinks = [] } = req.body;

    if (!name || !level) {
        return res.status(400).json({ message: 'name and level are required' });
    }

    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Mentor'];
    if (!validLevels.includes(level)) {
        return res.status(400).json({ message: `level must be one of: ${validLevels.join(', ')}` });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent duplicate skill names
        const exists = user.skillsHave.some(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            return res.status(409).json({ message: `Skill "${name}" already exists in skillsHave` });
        }

        // allowedToTeach is automatically true if at least one proof link is provided
        const allowedToTeach = proofLinks.length > 0;
        user.skillsHave.push({ name, level, proofLinks, allowedToTeach });

        // If proof links were added, check if user should be auto-upgraded
        await user.checkAndUpgrade();
        await user.save();

        res.status(201).json({ skillsHave: user.skillsHave });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /skills/have/:skillId ──────────────────────────────────────────────
// Update a skillHave (name, level, proofLinks).
// allowedToTeach cannot be changed by the user — admin only.
router.patch('/have/:skillId', verifyJWT, async (req, res) => {
    const { name, level, proofLinks } = req.body;

    if (level) {
        const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Mentor'];
        if (!validLevels.includes(level)) {
            return res.status(400).json({ message: `level must be one of: ${validLevels.join(', ')}` });
        }
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const skill = user.skillsHave.id(req.params.skillId);
        if (!skill) return res.status(404).json({ message: 'Skill not found' });

        if (name !== undefined) skill.name = name;
        if (level !== undefined) skill.level = level;
        if (proofLinks !== undefined) {
            skill.proofLinks = proofLinks;
            // Recalculate allowedToTeach based on updated proofLinks
            skill.allowedToTeach = proofLinks.length > 0;
        }

        // If proof links were updated, check if user should be auto-upgraded
        await user.checkAndUpgrade();
        await user.save();
        res.status(200).json({ skill });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE /skills/have/:skillId ─────────────────────────────────────────────
// Remove a skill from skillsHave.
router.delete('/have/:skillId', verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const skill = user.skillsHave.id(req.params.skillId);
        if (!skill) return res.status(404).json({ message: 'Skill not found' });

        skill.deleteOne();
        await user.save();

        res.status(200).json({ message: 'Skill removed', skillsHave: user.skillsHave });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /skills/want ────────────────────────────────────────────────────────
// Add a skill name to skillsWant.
// Body: { name }
router.post('/want', verifyJWT, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const normalised = name.trim();
        if (user.skillsWant.includes(normalised)) {
            return res.status(409).json({ message: `"${normalised}" already in skillsWant` });
        }

        user.skillsWant.push(normalised);
        await user.save();

        res.status(201).json({ skillsWant: user.skillsWant });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE /skills/want/:skillName ──────────────────────────────────────────
// Remove a skill name from skillsWant.
router.delete('/want/:skillName', verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const before = user.skillsWant.length;
        user.skillsWant = user.skillsWant.filter(
            (s) => s.toLowerCase() !== req.params.skillName.toLowerCase()
        );

        if (user.skillsWant.length === before) {
            return res.status(404).json({ message: 'Skill not found in skillsWant' });
        }

        await user.save();
        res.status(200).json({ skillsWant: user.skillsWant });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
