const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    skill: {
        type: String,
        required: true,
        trim: true,
    },
    topic: {
        type: String,
        required: true,
        trim: true,
    },
    timeSlot: {
        type: String, // e.g. "2026-02-25T14:00" or any string the frontend sends
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'closed'],
        default: 'pending',
    },
    requesterConfirmed: {
        type: Boolean,
        default: false,
    },
    teacherConfirmed: {
        type: Boolean,
        default: false,
    },
    ratingGivenByRequester: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
    },
    ratingGivenByTeacher: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
    },
    // For contributor requesters: coins they offered to stake for this session
    stakeCoins: {
        type: Number,
        default: 0,
    },
    // Coins actually locked when teacher accepts (0 for beginners using credits)
    lockedCoins: {
        type: Number,
        default: 0,
    },
    // Who cancelled (set when status = 'cancelled')
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Session', sessionSchema);
