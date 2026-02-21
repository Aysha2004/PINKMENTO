import React, { useState } from 'react';
import axios from 'axios';

function Dashboard({ user, onLogout }) {
    const [matches, setMatches] = useState([]);
    const [message, setMessage] = useState('');

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
        headers: { Authorization: `Bearer ${token}` }
    });

    const testFetchMatches = async () => {
        try {
            setMessage('Fetching matches...');
            // First let's hack some skillsWant so the API actually returns matches
            // (since your current user probably has [] for skillsWant)
            await api.post('/skills/want', { name: 'React' });

            const res = await api.get('/match', { params: { limit: 5 } });
            setMatches(res.data.matches);
            setMessage(`Found ${res.data.matches.length} matches!`);
        } catch (err) {
            setMessage('Error fetching matches: ' + (err.response?.data?.message || err.message));
        }
    };

    const testBookSession = async (teacherId, skillName) => {
        try {
            setMessage(`Booking session for ${skillName}...`);
            const res = await api.post('/sessions', {
                teacherId,
                skill: skillName,
                topic: 'Help me understand the basics',
                timeSlot: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            });
            setMessage(`Session booked! Status: ${res.data.session.status}`);
        } catch (err) {
            setMessage('Error booking session: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-card">
                <div className="user-header">
                    {user.photo && (
                        <img
                            className="avatar"
                            src={user.photo}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <div>
                        <h2 className="user-name">{user.name}</h2>
                        <p className="user-email">{user.email}</p>
                        <span className="badge">{user.role}</span>
                    </div>
                </div>

                <div className="stats-grid">
                    <StatCard label="Coins" value={user.coins} icon="🪙" />
                    <StatCard label="Credits" value={user.beginnerCredits} icon="🎟️" />
                    <StatCard label="Reputation" value={user.reputation} icon="⭐" />
                    <StatCard label="Sessions Taught" value={user.sessionsTaught} icon="🎓" />
                    <StatCard label="Sessions Learned" value={user.sessionsLearned} icon="📚" />
                </div>

                <p className="joined-date">
                    Joined: {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                    })}
                </p>

                <div className="test-panel" style={{ marginTop: '20px', padding: '15px', background: '#2d2d2d', borderRadius: '8px' }}>
                    <h3>API Test Panel</h3>
                    <button onClick={testFetchMatches} style={{ padding: '8px 12px', background: '#ff4081', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}>
                        1. Find React Mentors
                    </button>
                    {message && <p style={{ color: '#ff4081', fontSize: '14px', marginBottom: '10px' }}>{message}</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {matches.map(m => (
                            <div key={m._id} style={{ background: '#1a1a1a', padding: '10px', borderRadius: '4px' }}>
                                <strong>{m.name}</strong> • Rep: {m.reputation} • Coins: {m.coins}
                                <br />
                                <span style={{ fontSize: '12px', color: '#aaa' }}>Teaches: {m.matchedSkills.map(s => s.name).join(', ')}</span>
                                <button
                                    onClick={() => testBookSession(m._id, m.matchedSkills[0].name)}
                                    style={{ display: 'block', marginTop: '8px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                    Book Session
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="logout-btn" onClick={onLogout} style={{ marginTop: '20px' }}>
                    Sign out
                </button>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="stat-card">
            <span className="stat-icon">{icon}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}

export default Dashboard;
