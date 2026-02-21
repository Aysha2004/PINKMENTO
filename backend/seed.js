require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('./models/User');

const seedUsers = async () => {
    try {
        // Force Google DNS to bypass local SRV lookup issues, matching config/db.js
        dns.setServers(['8.8.8.8', '8.8.4.4']);

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding...');

        // Check if demo users already exist before inserting
        const existingDemo = await User.findOne({ email: 'alex.demo@example.com' });
        if (existingDemo) {
            console.log('Demo users already exist in the database. Seeding skipped.');
            process.exit(0);
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const users = [
            // ─── BEGINNERS ──────────────────────────────────────────────────
            {
                name: "Alex Beginner",
                email: "alex.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                role: 'beginner',
                coins: 10,
                beginnerCredits: 3,
                reputation: 0,
                sessionsTaught: 0,
                sessionsLearned: 0,
                skillsWant: ["html", "git", "flutter"],
                skillsHave: [],
                createdAt: now,
                beginnerExpiry: thirtyDaysFromNow,
            },
            {
                name: "Sam Explorer",
                email: "sam.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
                role: 'beginner',
                coins: 5,
                beginnerCredits: 2,
                reputation: 0,
                sessionsTaught: 0,
                sessionsLearned: 1,
                skillsWant: ["react", "javascript", "css"],
                skillsHave: [],
                createdAt: now,
                beginnerExpiry: thirtyDaysFromNow,
            },

            // ─── INTERMEDIATE CONTRIBUTORS ──────────────────────────────────
            {
                name: "Jamie Coder",
                email: "jamie.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
                role: 'contributor',
                coins: 50,
                beginnerCredits: 0,
                reputation: 15,
                sessionsTaught: 2,
                sessionsLearned: 5,
                skillsWant: ["node.js", "docker"],
                skillsHave: [
                    { name: "HTML", level: "Advanced", allowedToTeach: true, proofLinks: ["https://github.com/jamie/html"] },
                    { name: "Git", level: "Intermediate", allowedToTeach: true, proofLinks: ["https://github.com/jamie/git"] },
                    { name: "CSS", level: "Intermediate", allowedToTeach: false, proofLinks: [] }
                ],
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
            },
            {
                name: "Taylor Builder",
                email: "taylor.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
                role: 'contributor',
                coins: 75,
                beginnerCredits: 0,
                reputation: 22,
                sessionsTaught: 4,
                sessionsLearned: 7,
                skillsWant: ["typescript", "aws"],
                skillsHave: [
                    { name: "React", level: "Intermediate", allowedToTeach: true, proofLinks: ["https://github.com/taylor/react"] },
                    { name: "JavaScript", level: "Advanced", allowedToTeach: true, proofLinks: ["https://github.com/taylor/js"] }
                ],
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
            },

            // ─── EXPERT MENTORS ─────────────────────────────────────────────
            {
                name: "Dr. Code (Expert)",
                email: "dr.code.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=DrCode",
                role: 'contributor', // Note: 'mentor' isn't fully separated from contributor yet in logic, but conceptually they are mentors
                coins: 500,
                beginnerCredits: 0,
                reputation: 150,
                sessionsTaught: 35,
                sessionsLearned: 10,
                skillsWant: ["machine learning", "go"],
                skillsHave: [
                    { name: "React", level: "Mentor", allowedToTeach: true, proofLinks: ["https://github.com/drcode/react-expert"] },
                    { name: "Node.js", level: "Mentor", allowedToTeach: true, proofLinks: ["https://github.com/drcode/node-expert"] },
                    { name: "DSA", level: "Advanced", allowedToTeach: true, proofLinks: ["https://leetcode.com/drcode"] }
                ],
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365), // 1 year ago
            },
            {
                name: "Priya Flutter Dev",
                email: "priya.demo@example.com",
                photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                role: 'contributor',
                coins: 420,
                beginnerCredits: 0,
                reputation: 120,
                sessionsTaught: 28,
                sessionsLearned: 4,
                skillsWant: ["rust", "web3"],
                skillsHave: [
                    { name: "Flutter", level: "Mentor", allowedToTeach: true, proofLinks: ["https://github.com/priya/flutter-apps"] },
                    { name: "Dart", level: "Mentor", allowedToTeach: true, proofLinks: ["https://github.com/priya/dart"] },
                    { name: "Firebase", level: "Advanced", allowedToTeach: true, proofLinks: ["https://github.com/priya/firebase"] }
                ],
                createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 300), // 300 days ago
            }
        ];

        await User.insertMany(users);
        console.log(`✅ successfully seeded ${users.length} demo users!`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed database:', err);
        process.exit(1);
    }
};

seedUsers();
