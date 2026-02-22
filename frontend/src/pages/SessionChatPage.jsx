import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import './SessionChatPage.css';
import { sessionsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const SessionChatPage = () => {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const { user } = useAuth();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await sessionsAPI.getSession(sessionId);
                setSession(res.data.session);
            } catch (err) {
                console.error("Failed to fetch session", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'user',
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setInputValue("");
    };

    const submitRating = async () => {
        if (rating === 0) {
            alert("Please select a star rating.");
            return;
        }
        try {
            await sessionsAPI.rateSession(sessionId, rating);
            setShowRatingModal(false);
            navigate('/sessions');
        } catch (err) {
            console.error("Rating failed", err);
        }
    };

    const handleAccept = async () => {
        try {
            await sessionsAPI.acceptSession(sessionId);
            window.location.reload();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading">Loading session... 🎀</div>;
    if (!session) return <div className="error">Session not found.</div>;

    const isTeacher = session.teacherId?._id === user?._id;
    const otherPerson = isTeacher ? session.requesterId : session.teacherId;

    return (
        <div className="chat-page-container">
            <div className="chat-layout">

                {/* Header Top Bar */}
                <div className="chat-top-header">
                    <div className="chat-header-left">
                        <button className="back-btn-chat" onClick={() => navigate('/sessions')}>&larr; Sessions</button>
                        <h1 className="chat-page-title">Session: {session.skill} 💬</h1>
                    </div>
                    <div className="chat-header-actions">
                        {session.status === 'pending' && isTeacher && (
                            <>
                                <button className="accept-btn-mini" onClick={handleAccept}>Accept ✅</button>
                                <button className="reject-btn-mini" onClick={() => navigate('/sessions')}>Reject ✕</button>
                            </>
                        )}
                        {session.status === 'accepted' && (
                            <Button variant="google" onClick={() => setShowRatingModal(true)} className="end-session-btn">
                                Complete Session
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Chat Window */}
                <div className="chat-window-container">

                    {/* Top Bar with Mentor Info */}
                    <div className="chat-mentor-topbar">
                        <div className="chat-mentor-profile">
                            <img src={otherPerson?.photo} alt={otherPerson?.name} className="chat-mentor-img" />
                            <div className="chat-mentor-details">
                                <h2 className="chat-mentor-name">{otherPerson?.name}</h2>
                                <p className="chat-mentor-skill">{isTeacher ? 'Learner' : 'Mentor'}</p>
                            </div>
                        </div>
                        <div className={`chat-status-badge status-${session.status}`}>
                            <span className="status-dot blink"></span>
                            {session.status.toUpperCase()}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="chat-messages-area">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'wrapper-user' : 'wrapper-mentor'}`}>
                                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-mentor'}`}>
                                    <p className="chat-text">{msg.text}</p>
                                </div>
                                <span className="chat-time">{msg.time}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Bottom Input Area */}
                    <div className="chat-input-area">
                        <form className="chat-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="chat-input-field"
                                placeholder="Type your message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <button type="submit" className="chat-send-btn">
                                SEND
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="modal-overlay">
                    <div className="rating-modal">
                        <h2 className="modal-title">Rate Your Mentor ⭐</h2>
                        <p className="modal-desc">How was your session with {otherPerson?.name}?</p>

                        <div className="star-rating-container">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="feedback-textarea"
                            placeholder="Leave optional feedback..."
                            rows="3"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        ></textarea>

                        <div className="modal-actions">
                            <button className="modal-cancel-btn" onClick={() => setShowRatingModal(false)}>Cancel</button>
                            <Button variant="primary" onClick={submitRating} className="modal-submit-btn">
                                Submit Rating
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SessionChatPage;
