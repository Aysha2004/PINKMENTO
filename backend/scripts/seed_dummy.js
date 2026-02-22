const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');

const mentors = [
    {
        name: "Luna Pixel",
        email: "luna@example.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
        role: "contributor",
        reputation: 4.8,
        coins: 100,
        bio: "UI/UX Designer with a passion for pixel-perfect interfaces.",
        skillsHave: [
            { name: "UI/UX Design", category: "Design", level: "Mentor", cost: 5, allowedToTeach: true, description: "Mastering Figma and user-centric design principles." }
        ]
    },
    {
        name: "Cody Byte",
        email: "cody@example.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cody",
        role: "contributor",
        reputation: 4.5,
        coins: 50,
        bio: "Pythonista and automation enthusiast.",
        skillsHave: [
            { name: "Python", category: "Programming", level: "Advanced", cost: 3, allowedToTeach: true, description: "Data science and backend automation with Python." }
        ]
    },
    {
        name: "Sarah Script",
        email: "sarah@example.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        role: "contributor",
        reputation: 4.9,
        coins: 120,
        bio: "Full-stack dev who loves JavaScript frameworks.",
        skillsHave: [
            { name: "JavaScript", category: "Programming", level: "Mentor", cost: 5, allowedToTeach: true, description: "React, Node.js, and modern JS ecosystems." }
        ]
    },
    {
        name: "Alex Cloud",
        email: "alex@example.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        role: "contributor",
        reputation: 4.2,
        coins: 30,
        bio: "Cloud architect helping people migrate to the cloud.",
        skillsHave: [
            { name: "AWS", category: "Infrastructure", level: "Intermediate", cost: 4, allowedToTeach: true, description: "Hands-on with EC2, S3, and Lambda." }
        ]
    },
    {
        name: "Maya Art",
        email: "maya@example.com",
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
        role: "contributor",
        reputation: 4.7,
        coins: 80,
        bio: "Digital artist and illustrator.",
        skillsHave: [
            { name: "Digital Art", category: "Creative", level: "Mentor", cost: 5, allowedToTeach: true, description: "Concept art and character design." }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB for seeding...");

        // 1. Create Mentors
        const createdMentors = [];
        for (const mData of mentors) {
            let user = await User.findOne({ email: mData.email });
            if (!user) {
                user = await User.create(mData);
                console.log(`Created mentor: ${user.name}`);
            } else {
                console.log(`Mentor already exists: ${user.name}`);
            }
            createdMentors.push(user);
        }

        // 2. Find a learner (prefer a real user from logs, or use the first one)
        const learner = await User.findOne({ role: 'beginner' }) || await User.findOne({});
        if (!learner) {
            console.log("No learner found to create sessions for.");
            process.exit(0);
        }
        console.log(`Creating dummy sessions for learner: ${learner.email}`);

        // 3. Create Sessions
        const sessionData = [
            { skill: "UI/UX Design", topic: "Figma Bascis", status: "completed" },
            { skill: "Python", topic: "Intro to Flask", status: "accepted" },
            { skill: "JavaScript", topic: "React Hooks", status: "pending" },
            { skill: "AWS", topic: "Setting up S3", status: "cancelled" },
            { skill: "Digital Art", topic: "Shading Techniques", status: "completed" }
        ];

        for (let i = 0; i < createdMentors.length; i++) {
            const sess = sessionData[i];
            const existing = await Session.findOne({
                requesterId: learner._id,
                teacherId: createdMentors[i]._id,
                skill: sess.skill
            });

            if (!existing) {
                await Session.create({
                    requesterId: learner._id,
                    teacherId: createdMentors[i]._id,
                    skill: sess.skill,
                    topic: sess.topic,
                    timeSlot: "2026-03-01 10:00 AM",
                    status: sess.status,
                    stakeCoins: 2,
                    lockedCoins: sess.status !== 'pending' ? 2 : 0
                });
                console.log(`Created dummy session: ${sess.skill} with ${createdMentors[i].name}`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
