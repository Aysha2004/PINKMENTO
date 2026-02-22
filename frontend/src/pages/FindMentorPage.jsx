import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import './FindMentorPage.css';
import { matchAPI } from '../api/api';

const FindMentorPage = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRating, setFilterRating] = useState("all");

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await matchAPI.getMatches();
                setMentors(res.data.matches);
            } catch (err) {
                console.error("Failed to fetch matches", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

    const handleRequest = (mentorId) => {
        navigate(`/session/${mentorId}`);
    };

    const getLevelClass = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'level-beg';
            case 'intermediate': return 'level-int';
            case 'advanced': return 'level-adv';
            case 'mentor': return 'level-adv';
            default: return '';
        }
    };

    // Filter logic
    let filteredMentors = mentors.filter(mentor =>
        (mentor.matchedSkills?.[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterRating === "high") {
        filteredMentors.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    } else if (filterRating === "low") {
        filteredMentors.sort((a, b) => (a.reputation || 0) - (b.reputation || 0));
    }

    if (loading) {
        return (
            <div className="loading-container" style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'var(--font-pixel)',
                backgroundColor: 'var(--bg-pink)'
            }}>
                Finding mentors... 🔍
            </div>
        );
    }

    return (
        <div className="find-mentor-container">
            <div className="find-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>
                <h1 className="find-title">Find Your Perfect Mentor 🔍</h1>
                <p className="find-tagline">Search for people who can teach what you want to learn.</p>
            </div>

            <div className="search-filter-section">
                <div className="search-box">
                    <span className="search-icon">🚀</span>
                    <input
                        type="text"
                        placeholder="Search by name or skill..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-box">
                    <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Rating: All</option>
                        <option value="high">Reputation: High to Low</option>
                        <option value="low">Reputation: Low to High</option>
                    </select>
                </div>
            </div>

            <div className="mentor-cards-grid">
                {filteredMentors.map((mentor) => (
                    <div className="mentor-card-modern" key={mentor._id}>
                        <div className="mentor-card-header">
                            <div className="mentor-image-container">
                                <img src={mentor.photo} alt={mentor.name} className="mentor-profile-img" />
                            </div>
                            <div className="mentor-basic-info">
                                <h2 className="pixel-name-title">{mentor.name}</h2>
                                <p className="mentor-primary-skill">
                                    {mentor.matchedSkills?.map(s => s.name).join(', ') || 'No matched skills'}
                                </p>
                            </div>
                        </div>

                        <div className="mentor-card-body">
                            {mentor.matchedSkills?.[0] && (
                                <span className={`skill-level-badge ${getLevelClass(mentor.matchedSkills[0].level)}`}>
                                    {mentor.matchedSkills[0].level}
                                </span>
                            )}
                            <p className="mentor-bio">
                                {mentor.bio ? `"${mentor.bio}"` : "Ready to share knowledge and help you grow!"}
                            </p>
                        </div>

                        <div className="mentor-card-footer">
                            <div className="mentor-stats-row">
                                <div className="stat-pill">⭐ {mentor.reputation?.toFixed(1) || '0.0'}</div>
                                <div className="stat-pill">💼 {(mentor.sessionsTaught || 0) + (mentor.sessionsLearned || 0)} Sess.</div>
                            </div>
                            <Button variant="primary" onClick={() => handleRequest(mentor._id)} className="request-btn">
                                Request Session
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMentors.length === 0 && (
                <div className="no-results">
                    <p>No matches found for "{searchTerm}".</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Tip: Make sure you've added the skills you want to learn in your profile!</p>
                </div>
            )}
        </div>
    );
};

export default FindMentorPage;
