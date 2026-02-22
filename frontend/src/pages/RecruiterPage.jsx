import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import './RecruiterPage.css';

const MOCK_MENTORS = [
    {
        id: 1,
        name: "Jordan Lee",
        skill: "React Native",
        rating: 5.0,
        sessions: 200,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Jordan&backgroundColor=FFC0CB"
    },
    {
        id: 2,
        name: "Alex Johnson",
        skill: "Frontend Dev",
        rating: 4.9,
        sessions: 120,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=FFC0CB"
    },
    {
        id: 3,
        name: "Sam Chen",
        skill: "UI/UX Design",
        rating: 4.8,
        sessions: 85,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=FFC0CB"
    },
    {
        id: 4,
        name: "Taylor Smith",
        skill: "Backend Eng",
        rating: 4.7,
        sessions: 64,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Taylor&backgroundColor=FFC0CB"
    },
    {
        id: 5,
        name: "Casey Davis",
        skill: "Data Science",
        rating: 4.6,
        sessions: 42,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Casey&backgroundColor=FFC0CB"
    },
    {
        id: 6,
        name: "Morgan Webb",
        skill: "Cloud Arch",
        rating: 4.5,
        sessions: 30,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Morgan&backgroundColor=FFC0CB"
    },
    {
        id: 7,
        name: "Riley Moore",
        skill: "Product Mgmt",
        rating: 4.4,
        sessions: 25,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Riley&backgroundColor=FFC0CB"
    },
    {
        id: 8,
        name: "Avery White",
        skill: "DevOps",
        rating: 4.2,
        sessions: 15,
        image: "https://api.dicebear.com/7.x/notionists/svg?seed=Avery&backgroundColor=FFC0CB"
    }
];

const RecruiterPage = () => {
    const navigate = useNavigate();

    const topMentors = MOCK_MENTORS.slice(0, 3);
    const regularMentors = MOCK_MENTORS.slice(3);

    const handleRecruit = (mentorName) => {
        console.log(`Recruited ${mentorName}`);
    };

    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return '';
    };

    return (
        <div className="recruiter-container">
            <div className="recruiter-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>
                <h1 className="recruiter-title">Top Mentors Leaderboard 🏆</h1>
                <p className="recruiter-tagline">Explore top-rated mentors and recruit them.</p>
            </div>

            {/* Top 3 Section */}
            <div className="top-mentors-section">
                {topMentors.map((mentor, index) => (
                    <div className={`top-mentor-card ${index === 0 ? 'rank-one' : ''}`} key={mentor.id}>
                        <div className="rank-badge">
                            <span className="rank-number">#{index + 1}</span>
                            <span className="rank-medal">{getMedal(index)}</span>
                        </div>

                        <div className="mentor-profile-section">
                            <div className="mentor-image-wrapper">
                                <img src={mentor.image} alt={mentor.name} className="mentor-img" />
                            </div>
                            <div className="mentor-basic-info">
                                <h2 className="pixel-name">{mentor.name}</h2>
                                <p className="mentor-skill">{mentor.skill}</p>
                            </div>
                        </div>

                        <div className="mentor-metrics">
                            <div className="metric-box">
                                <span className="metric-icon">⭐</span>
                                <span className="metric-value">{mentor.rating}</span>
                            </div>
                            <div className="metric-divider"></div>
                            <div className="metric-box">
                                <span className="metric-icon">📚</span>
                                <span className="metric-value">{mentor.sessions} <span className="metric-label">Sessions</span></span>
                            </div>
                        </div>

                        <div className="mentor-action">
                            <Button variant="primary" onClick={() => handleRecruit(mentor.name)} className="recruit-btn">
                                Recruit
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Remaining List Section */}
            <div className="mentors-list-section">
                {regularMentors.map((mentor, index) => (
                    <div className="list-mentor-row" key={mentor.id}>
                        <div className="list-rank">
                            <span className="rank-number">#{index + 4}</span>
                        </div>

                        <div className="list-profile">
                            <img src={mentor.image} alt={mentor.name} className="list-img" />
                            <div className="list-info">
                                <h3 className="pixel-name-small">{mentor.name}</h3>
                                <p className="list-skill">{mentor.skill}</p>
                            </div>
                        </div>

                        <div className="list-stats">
                            <div className="list-stat-item">⭐ {mentor.rating}</div>
                            <div className="list-stat-item">📚 {mentor.sessions} Sess.</div>
                        </div>

                        <div className="list-action">
                            <Button variant="google" onClick={() => handleRecruit(mentor.name)} className="recruit-btn-small">
                                Recruit
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecruiterPage;
