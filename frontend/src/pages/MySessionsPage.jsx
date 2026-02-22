import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './MySessionsPage.css';

const MySessionsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await sessionsAPI.getSessions();
                setSessions(res.data.sessions);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'accepted': return 'status-accepted';
            case 'completed': return 'status-completed';
            case 'cancelled':
            case 'rejected': return 'status-cancelled';
            default: return '';
        }
    };

    const upcomingStatuses = ['pending', 'accepted'];
    const upcomingSessions = sessions.filter(s => upcomingStatuses.includes(s.status?.toLowerCase()));
    const pastSessions = sessions.filter(s => !upcomingStatuses.includes(s.status?.toLowerCase()));

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
                Loading sessions... 📅
            </div>
        );
    }

    return (
        <div className="sessions-container">
            <div className="sessions-header">
                <button className="back-btn-sessions" onClick={() => navigate('/dashboard')}>
                    &larr; Dashboard
                </button>
                <h1 className="sessions-page-title">My Sessions 📅</h1>
                <p className="sessions-tagline">Manage your learning and teaching schedule.</p>
            </div>

            {/* Upcoming Sessions */}
            <section className="sessions-section">
                <h2 className="section-title">Upcoming Sessions</h2>
                <div className="sessions-grid">
                    {upcomingSessions.map(session => {
                        const isTeacher = session.teacherId?._id === user?._id;
                        const otherPerson = isTeacher ? session.requesterId : session.teacherId;

                        return (
                            <div key={session._id} className="session-card session-card--upcoming">
                                <div className="session-card-header">
                                    <span className={`role-badge ${isTeacher ? 'role-badge--teacher' : 'role-badge--learner'}`}>
                                        {isTeacher ? 'Teaching' : 'Learning'}
                                    </span>
                                    <span className={`status-badge ${getStatusClass(session.status)}`}>
                                        {session.status?.toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="session-skill">{session.skill}</h3>
                                <p className="session-topic">Topic: {session.topic}</p>

                                <div className="session-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">👤</span>
                                        <span>{isTeacher ? 'Learner' : 'Mentor'}: {otherPerson?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">⏰</span>
                                        <span>{session.timeSlot}</span>
                                    </div>
                                </div>

                                {session.status === 'accepted' && (
                                    <button
                                        className="join-session-btn"
                                        onClick={() => navigate(`/chat/${session._id}`)}
                                    >
                                        Go to Session 🎥
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {upcomingSessions.length === 0 && (
                        <div className="empty-msg-container">
                            <p className="empty-msg">No upcoming sessions. Time to learn something new!</p>
                            <button className="book-now-btn" onClick={() => navigate('/find')}>Book a Session 🚀</button>
                        </div>
                    )}
                </div>
            </section>

            {/* Past Sessions */}
            <section className="sessions-section">
                <h2 className="section-title">Past Sessions</h2>
                <div className="sessions-grid">
                    {pastSessions.map(session => {
                        const isTeacher = session.teacherId?._id === user?._id;
                        const otherPerson = isTeacher ? session.requesterId : session.teacherId;

                        return (
                            <div key={session._id} className="session-card session-card--past">
                                <div className="session-card-header">
                                    <span className="past-badge">PAST</span>
                                    <span className={`status-badge ${getStatusClass(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                                <h3 className="session-skill">{session.skill}</h3>
                                <div className="session-meta">
                                    <span>{isTeacher ? 'With' : 'By'} {otherPerson?.name}</span>
                                    <span>•</span>
                                    <span>{session.timeSlot}</span>
                                </div>
                            </div>
                        );
                    })}
                    {pastSessions.length === 0 && <p className="empty-msg">Your history is looking clean! ✨</p>}
                </div>
            </section>
        </div>
    );
};

export default MySessionsPage;
