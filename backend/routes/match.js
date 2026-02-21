const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Level priority for sorting ───────────────────────────────────────────────
const LEVEL_PRIORITY = { Mentor: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };

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

// ─── Helper: get the best (highest level) matched skill for a user ────────────
const getBestMatchLevel = (user, wantSet) => {
    let best = 0;
    for (const skill of user.skillsHave) {
        if (skill.allowedToTeach && wantSet.has(skill.name.toLowerCase())) {
            const priority = LEVEL_PRIORITY[skill.level] || 0;
            if (priority > best) best = priority;
        }
    }
    return best;
};

// ─── GET /match ───────────────────────────────────────────────────────────────
// Returns up to 5 users who can teach skills the current user wants to learn.
// Matching rule: their skillsHave.name ∈ my skillsWant AND allowedToTeach = true
// Sort: 1) reputation desc  2) best matched skill level desc
router.get('/', verifyJWT, async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId).select('skillsWant');
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        const { skillsWant } = currentUser;

        if (!skillsWant || skillsWant.length === 0) {
            return res.status(200).json({ matches: [] });
        }

        // Build case-insensitive regex to match any of the wanted skill names
        const escapedNames = skillsWant.map(
            (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const nameRegex = new RegExp(`^(${escapedNames.join('|')})$`, 'i');

        // Find all other users who have at least one matching teachable skill
        const candidates = await User.find({
            _id: { $ne: req.userId },
            skillsHave: {
                $elemMatch: {
                    name: nameRegex,
                    allowedToTeach: true,
                },
            },
        }).select('name email photo role reputation skillsHave skillsWant');

        // Build a lowercase set of the current user's wanted skills for fast lookup
        const wantSet = new Set(skillsWant.map((s) => s.toLowerCase()));

        // Sort: reputation desc → best matched skill level desc
        candidates.sort((a, b) => {
            if (b.reputation !== a.reputation) return b.reputation - a.reputation;
            return getBestMatchLevel(b, wantSet) - getBestMatchLevel(a, wantSet);
        });

        // Attach which skills matched (useful for the frontend to display)
        const top5 = candidates.slice(0, 5).map((user) => {
            const matchedSkills = user.skillsHave.filter(
                (s) => s.allowedToTeach && wantSet.has(s.name.toLowerCase())
            );
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                photo: user.photo,
                role: user.role,
                reputation: user.reputation,
                matchedSkills, // skills that caused this match
            };
        });

        res.status(200).json({ matches: top5 });
    } catch (err) {
        console.error('Match error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
