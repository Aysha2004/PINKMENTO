const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');
const User = require('../models/User');

const logFile = path.join(__dirname, '../../debug.log');
const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] SESS: ${msg}\n`);
};

// ─── Constants ────────────────────────────────────────────────────────────────
const BEGINNER_SESSION_REWARD = 5;   // coins teacher earns when a beginner completes
const CANCEL_REPUTATION_PENALTY = 5; // reputation deducted from canceller

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
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// ─── POST /sessions ───────────────────────────────────────────────────────────
// Requester creates a session request.
// Beginner body:     { teacherId, skill, topic, timeSlot }
// Contributor body:  { teacherId, skill, topic, timeSlot, stakeCoins }
router.post('/', verifyJWT, async (req, res) => {
    const { teacherId, skill, topic, timeSlot, stakeCoins = 0 } = req.body;
    logToFile(`Booking attempt: Requester ${req.userId} -> Teacher ${teacherId} for skill "${skill}"`);

    if (!teacherId || !skill || !topic || !timeSlot) {
        logToFile("ERROR: Missing required fields in booking request");
        return res.status(400).json({ message: 'teacherId, skill, topic, and timeSlot are required' });
    }

    try {
        const teacher = await User.findById(teacherId);
        if (!teacher) {
            logToFile(`ERROR: Teacher ${teacherId} not found in DB`);
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const teacherSkill = teacher.skillsHave.find(
            (s) => s.name.toLowerCase() === skill.toLowerCase()
        );
        if (!teacherSkill) {
            logToFile(`ERROR: Teacher ${teacherId} does not have skill "${skill}"`);
            return res.status(403).json({ message: `Teacher does not have skill "${skill}"` });
        }
        logToFile(`Teacher skill found. Proceeding with booking.`);

        // For contributors, stakeCoins must be a positive number
        const requester = await User.findById(req.userId);
        if (requester.role !== 'beginner') {
            if (!stakeCoins || stakeCoins <= 0) {
                logToFile(`ERROR: Contributor requester ${req.userId} provided invalid stakeCoins: ${stakeCoins}`);
                return res.status(400).json({ message: 'Contributors must provide stakeCoins > 0' });
            }
            if (requester.coins < stakeCoins) {
                logToFile(`ERROR: Requester ${req.userId} has insufficient coins (${requester.coins}) for stake (${stakeCoins})`);
                return res.status(400).json({
                    message: `Not enough coins. You have ${requester.coins}, need ${stakeCoins}`,
                });
            }
        }

        const session = await Session.create({
            requesterId: req.userId,
            teacherId,
            skill,
            topic,
            timeSlot,
            status: 'pending',
            stakeCoins: requester.role !== 'beginner' ? stakeCoins : 0,
        });

        await session.populate([
            { path: 'requesterId', select: 'name email photo role' },
            { path: 'teacherId', select: 'name email photo' },
        ]);

        logToFile(`Session created successfully: ${session._id}`);
        res.status(201).json({ session });
    } catch (err) {
        logToFile(`ERROR creating session: ${err.message}`);
        console.error('Create session error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /sessions ────────────────────────────────────────────────────────────
// Returns all sessions where the current user is the requester OR the teacher.
router.get('/', verifyJWT, async (req, res) => {
    try {
        const sessions = await Session.find({
            $or: [{ requesterId: req.userId }, { teacherId: req.userId }],
        })
            .populate('requesterId', 'name email photo')
            .populate('teacherId', 'name email photo')
            .sort({ createdAt: -1 });

        res.status(200).json({ sessions });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /sessions/:id ────────────────────────────────────────────────────────
// Returns a single session (only if current user is requester or teacher).
router.get('/:id', verifyJWT, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('requesterId', 'name email photo')
            .populate('teacherId', 'name email photo');

        if (!session) return res.status(404).json({ message: 'Session not found' });

        const isParticipant =
            session.requesterId._id.toString() === req.userId.toString() ||
            session.teacherId._id.toString() === req.userId.toString();

        if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

        res.status(200).json({ session });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /sessions/:id/accept ───────────────────────────────────────────────
// Teacher accepts a pending session.
// Deducts from requester: beginnerCredits (beginner) or stakeCoins (contributor).
router.patch('/:id/accept', verifyJWT, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.teacherId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Only the teacher can accept this session' });
        }
        if (session.status !== 'pending') {
            return res.status(400).json({ message: `Session is already "${session.status}"` });
        }

        const requester = await User.findById(session.requesterId);
        if (!requester) return res.status(404).json({ message: 'Requester not found' });

        if (requester.role === 'beginner') {
            // Beginner pays with beginnerCredits
            if (requester.beginnerCredits <= 0) {
                return res.status(400).json({
                    message: 'Requester has no beginner credits remaining',
                });
            }
            requester.beginnerCredits -= 1;
            await requester.save();
            // lockedCoins stays 0 for beginners
        } else {
            // Contributor pays with coins (staked at request time)
            const stake = session.stakeCoins;
            if (requester.coins < stake) {
                return res.status(400).json({
                    message: `Requester no longer has enough coins (has ${requester.coins}, needs ${stake})`,
                });
            }
            requester.coins -= stake;
            requester.lockedCoins += stake;
            await requester.save();
            session.lockedCoins = stake;
        }

        session.status = 'accepted';
        await session.save();

        await session.populate([
            { path: 'requesterId', select: 'name email photo role coins lockedCoins beginnerCredits' },
            { path: 'teacherId', select: 'name email photo' },
        ]);

        res.status(200).json({ session });
    } catch (err) {
        console.error('Accept session error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /sessions/:id/reject ───────────────────────────────────────────────
// Teacher rejects a pending session.
router.patch('/:id/reject', verifyJWT, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.teacherId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Only the teacher can reject this session' });
        }
        if (session.status !== 'pending') {
            return res.status(400).json({ message: `Session is already "${session.status}"` });
        }

        session.status = 'rejected';
        await session.save();
        await session.populate([
            { path: 'requesterId', select: 'name email photo' },
            { path: 'teacherId', select: 'name email photo' },
        ]);

        res.status(200).json({ session });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /sessions/:id/confirm ─────────────────────────────────────────────
// Requester or teacher marks their side of the session as done.
// When BOTH confirm → status = 'completed' + coin transfers + counter increments.
router.patch('/:id/confirm', verifyJWT, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.status !== 'accepted') {
            return res.status(400).json({
                message: `Only accepted sessions can be confirmed. Status is "${session.status}"`,
            });
        }

        const userId = req.userId.toString();
        const isRequester = session.requesterId.toString() === userId;
        const isTeacher = session.teacherId.toString() === userId;

        if (!isRequester && !isTeacher) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (isRequester && session.requesterConfirmed) {
            return res.status(400).json({ message: 'You have already confirmed this session' });
        }
        if (isTeacher && session.teacherConfirmed) {
            return res.status(400).json({ message: 'You have already confirmed this session' });
        }

        if (isRequester) session.requesterConfirmed = true;
        if (isTeacher) session.teacherConfirmed = true;

        // ── Both confirmed → complete the session ─────────────────────────────
        if (session.requesterConfirmed && session.teacherConfirmed) {
            session.status = 'completed';

            const requester = await User.findById(session.requesterId);
            const teacher = await User.findById(session.teacherId);

            if (requester.role === 'beginner') {
                // Beginner session: teacher earns a fixed coin reward
                teacher.coins += BEGINNER_SESSION_REWARD;
            } else {
                // Contributor session: transfer locked coins to teacher
                teacher.coins += session.lockedCoins;
                requester.lockedCoins -= session.lockedCoins;
            }

            teacher.sessionsTaught += 1;
            requester.sessionsLearned += 1;

            // Check if requester should be auto-upgraded (e.g., hit 3 sessionsLearned)
            await requester.checkAndUpgrade();

            await requester.save();
            await teacher.save();
        }

        await session.save();
        await session.populate([
            { path: 'requesterId', select: 'name email photo role coins lockedCoins beginnerCredits sessionsLearned' },
            { path: 'teacherId', select: 'name email photo coins sessionsTaught' },
        ]);

        res.status(200).json({ session });
    } catch (err) {
        console.error('Confirm session error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /sessions/:id/cancel ───────────────────────────────────────────────
// Either participant can cancel an accepted session.
// Canceller gets a reputation penalty.
// If contributor requester cancels → locked coins go to teacher.
// If teacher cancels → locked coins go back to requester.
// Pending sessions can also be cancelled (no coins involved).
router.patch('/:id/cancel', verifyJWT, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const userId = req.userId.toString();
        const isRequester = session.requesterId.toString() === userId;
        const isTeacher = session.teacherId.toString() === userId;

        if (!isRequester && !isTeacher) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (!['pending', 'accepted'].includes(session.status)) {
            return res.status(400).json({
                message: `Cannot cancel a session with status "${session.status}"`,
            });
        }

        const canceller = await User.findById(req.userId);
        const otherUserId = isRequester ? session.teacherId : session.requesterId;
        const other = await User.findById(otherUserId);

        // ── Coin transfer (only if accepted + coins were locked) ──────────────
        if (session.status === 'accepted' && session.lockedCoins > 0) {
            if (isRequester) {
                // Requester cancels → teacher keeps the stake as compensation
                canceller.lockedCoins -= session.lockedCoins;
                other.coins += session.lockedCoins;
            } else {
                // Teacher cancels → return stake to requester
                other.lockedCoins -= session.lockedCoins;
                other.coins += session.lockedCoins;
            }
        }

        // ── Reputation penalty for canceller ──────────────────────────────────
        canceller.reputation = Math.max(0, canceller.reputation - CANCEL_REPUTATION_PENALTY);

        session.status = 'cancelled';
        session.cancelledBy = req.userId;

        await canceller.save();
        await other.save();
        await session.save();

        await session.populate([
            { path: 'requesterId', select: 'name email photo coins lockedCoins reputation' },
            { path: 'teacherId', select: 'name email photo coins reputation' },
            { path: 'cancelledBy', select: 'name email' },
        ]);

        res.status(200).json({ session });
    } catch (err) {
        console.error('Cancel session error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /sessions/:id/rate ───────────────────────────────────────────────
// Users rate each other after a session is completed.
// When BOTH have rated, status = 'closed'.
router.patch('/:id/rate', verifyJWT, async (req, res) => {
    try {
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
        }

        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.status !== 'completed') {
            return res.status(400).json({
                message: `Only completed sessions can be rated. Status is "${session.status}"`,
            });
        }

        const userId = req.userId.toString();
        const isRequester = session.requesterId.toString() === userId;
        const isTeacher = session.teacherId.toString() === userId;

        if (!isRequester && !isTeacher) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (isRequester) {
            if (session.ratingGivenByRequester) {
                return res.status(400).json({ message: 'You have already rated this session' });
            }
            session.ratingGivenByRequester = rating;
        }

        if (isTeacher) {
            if (session.ratingGivenByTeacher) {
                return res.status(400).json({ message: 'You have already rated this session' });
            }
            session.ratingGivenByTeacher = rating;
        }

        // ── Both rated → close the session ────────────────────────────────────
        if (session.ratingGivenByRequester && session.ratingGivenByTeacher) {
            session.status = 'closed';
        }

        await session.save();
        await session.populate([
            { path: 'requesterId', select: 'name email photo' },
            { path: 'teacherId', select: 'name email photo' },
        ]);

        res.status(200).json({ session });
    } catch (err) {
        console.error('Rate session error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
