import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* Minimal Top Navbar */}
            <nav className="dashboard-navbar">
                <span className="navbar-brand">Pink Mentor 🎀</span>
                <div className="navbar-actions">
                    <button
                        className="navbar-profile-btn"
                        onClick={() => navigate('/profile')}
                        title="My Profile"
                    >
                        <img src={user?.photo} alt="Profile" className="navbar-avatar" />
                    </button>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        Logout 🚪
                    </button>
                </div>
            </nav>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Welcome Back, {user?.name?.split(' ')?.[0] || 'User'} <span className="logo-icon">🎀</span></h1>
                <div className="dashboard-stats">
                    <span className="stat-badge">SkillCoins: {user?.coins || 0} 💰</span>
                    <span className="stat-badge">Reputation: ⭐ {user?.reputation?.toFixed(1) || '0.0'}</span>
                    <span className="stat-badge">Sessions: {(user?.sessionsTaught || 0) + (user?.sessionsLearned || 0)}</span>
                </div>
            </div>

            <div className="dashboard-cards-grid">
                <div className="action-card" onClick={() => navigate('/find')}>
                    <div className="card-icon">🔍</div>
                    <h2 className="card-title">Find a Mentor</h2>
                    <p className="card-desc">Search for experienced mentors.</p>
                </div>

                <div className="action-card" onClick={() => navigate('/teach')}>
                    <div className="card-icon">📚</div>
                    <h2 className="card-title">Teach a Skill</h2>
                    <p className="card-desc">Share your knowledge with others.</p>
                </div>

                <div className="action-card" onClick={() => navigate('/sessions')}>
                    <div className="card-icon">🤝</div>
                    <h2 className="card-title">View My Matches</h2>
                    <p className="card-desc">See your current learning sessions.</p>
                </div>

                <div className="action-card" onClick={() => navigate('/recruiters')}>
                    <div className="card-icon">🏆</div>
                    <h2 className="card-title">Recruit Talent</h2>
                    <p className="card-desc">Explore top-rated mentors and recruit them.</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
