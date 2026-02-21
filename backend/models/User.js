const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true, // allows multiple docs without googleId (safety)
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // one user per email — enforced at DB level
        lowercase: true,
        trim: true,
    },
    photo: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        default: 'beginner',
    },
    coins: {
        type: Number,
        default: 0,
    },
    lockedCoins: {
        type: Number,
        default: 0, // coins currently locked in active sessions
    },
    beginnerCredits: {
        type: Number,
        default: 3,
    },
    reputation: {
        type: Number,
        default: 0,
    },
    sessionsTaught: {
        type: Number,
        default: 0,
    },
    sessionsLearned: {
        type: Number,
        default: 0,
    },
    skillsHave: [
        {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            level: {
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Mentor'],
                required: true,
            },
            proofLinks: {
                type: [String],
                default: [],
            },
            allowedToTeach: {
                type: Boolean,
                default: false, // only set to true by admin/verification
            },
        },
    ],
    skillsWant: {
        type: [String], // array of skill names the user wants to learn
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    beginnerExpiry: {
        type: Date, // createdAt + 30 days, set at creation
    },
});

// ─── Instance Method: Auto-Upgrade to Contributor ─────────────────────────────
// Checks the three conditions. If any are met, upgrades role and locks credits.
// Returns a boolean indicating if an upgrade occurred.
userSchema.methods.checkAndUpgrade = async function () {
    if (this.role !== 'beginner') return false;

    let shouldUpgrade = false;

    // Condition 1: Expiry date passed
    if (this.beginnerExpiry && new Date() > this.beginnerExpiry) {
        shouldUpgrade = true;
    }
    // Condition 2: Attended >= 3 sessions
    else if (this.sessionsLearned >= 3) {
        shouldUpgrade = true;
    }
    // Condition 3: Has uploaded at least one proof link for any skill
    else if (this.skillsHave && this.skillsHave.some((skill) => skill.proofLinks && skill.proofLinks.length > 0)) {
        shouldUpgrade = true;
    }

    if (shouldUpgrade) {
        this.role = 'contributor';
        this.beginnerCredits = 0; // permanently gone
        await this.save();
        return true;
    }

    return false;
};

module.exports = mongoose.model('User', userSchema);
