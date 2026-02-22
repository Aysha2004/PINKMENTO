import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import './SessionBookingPage.css';
import { sessionsAPI, authAPI } from '../api/api';

const SessionBookingPage = () => {
    const navigate = useNavigate();
    const { mentorId } = useParams();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("30 min");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const res = await authAPI.getUserProfile(mentorId);
                setMentor(res.data.user);
            } catch (err) {
                console.error("Failed to fetch mentor", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMentor();
    }, [mentorId]);

    const handleConfirm = async (e) => {
        e.preventDefault();
        setBooking(true);
        try {
            const selectedSkill = mentor.matchedSkills?.[0]?.name || mentor.skillsHave?.[0]?.name || "General Mentorship";
            await sessionsAPI.createSession({
                teacherId: mentorId,
                skill: selectedSkill,
                topic: notes || "Initial session",
                timeSlot: `${date} ${time} (${duration})`,
                stakeCoins: 2
            });
            navigate('/sessions');
        } catch (err) {
            console.error("Booking failed", err);
            alert("Failed to book session. Please try again.");
        } finally {
            setBooking(false);
        }
    };

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
                Fetching mentor details... 🎮
            </div>
        );
    }

    if (!mentor) {
        return <div className="error-container">Mentor not found. <button onClick={() => navigate('/find')}>Go back</button></div>;
    }

    return (
        <div className="booking-container">
            <div className="booking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>
                <h1 className="booking-title">Book Your Session 🎮</h1>
                <p className="booking-tagline">Set up a time to level up your skills.</p>
            </div>

            <div className="booking-content-split">

                {/* Left Side: Mentor Card */}
                <div className="booking-mentor-side">
                    <h2 className="section-title">Selected Mentor</h2>
                    <div className="booking-mentor-card">
                        <div className="booking-mentor-image-wrapper">
                            <img src={mentor.photo} alt={mentor.name} className="booking-mentor-img" />
                        </div>
                        <h3 className="booking-mentor-name">{mentor.name}</h3>
                        <p className="booking-mentor-skill">{mentor.matchedSkills?.[0]?.name || mentor.skillsHave?.[0]?.name || 'General Mentorship'}</p>

                        <div className="booking-mentor-stats">
                            <span className="stat-pill">⭐ {mentor.reputation?.toFixed(1) || '0.0'}</span>
                            <span className="stat-pill">💼 {(mentor.sessionsTaught || 0) + (mentor.sessionsLearned || 0)} Sess.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Booking Form */}
                <div className="booking-form-side">
                    <div className="booking-form-card">
                        <h2 className="section-title">Session Details</h2>

                        <form className="booking-form" onSubmit={handleConfirm}>
                            <div className="form-group">
                                <label className="form-label">Select Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half-width">
                                    <label className="form-label">Select Time</label>
                                    <select
                                        className="form-input"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Choose time</option>
                                        <option value="09:00 AM">09:00 AM</option>
                                        <option value="10:00 AM">10:00 AM</option>
                                        <option value="01:00 PM">01:00 PM</option>
                                        <option value="03:00 PM">03:00 PM</option>
                                        <option value="06:00 PM">06:00 PM</option>
                                    </select>
                                </div>
                                <div className="form-group half-width">
                                    <label className="form-label">Duration</label>
                                    <select
                                        className="form-input"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        required
                                    >
                                        <option value="30 min">30 min</option>
                                        <option value="1 hour">1 hour</option>
                                        <option value="2 hours">2 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes for Mentor (Optional)</label>
                                <textarea
                                    className="form-input textarea"
                                    placeholder="What do you want to learn?"
                                    rows="3"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>



                            <div className="cost-section">
                                <span className="cost-label">Total Cost:</span>
                                <span className="cost-badge">SkillCoin Cost: 2 💰</span>
                            </div>

                            <div className="booking-actions">
                                <button type="button" className="cancel-btn" onClick={() => navigate(-1)} disabled={booking}>
                                    Cancel
                                </button>
                                <Button type="submit" variant="primary" className="confirm-btn" disabled={booking}>
                                    {booking ? "Confirming... ✨" : "Confirm Booking"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SessionBookingPage;
