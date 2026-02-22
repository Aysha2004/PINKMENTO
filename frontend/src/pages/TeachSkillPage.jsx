import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import './TeachSkillPage.css';

const SKILL_CATEGORIES = [
    "Programming & Development",
    "Design & Creativity",
    "Data & Analytics",
    "Business & Marketing",
    "Language Learning",
    "Music & Arts",
    "Science & Engineering",
    "Other"
];

const AVAILABILITY_OPTIONS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

import { skillsAPI } from '../api/api';

const TeachSkillPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [skillName, setSkillName] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('30 min');
    const [skillCoinCost, setSkillCoinCost] = useState(1);
    const [availability, setAvailability] = useState([]);

    const toggleDay = (day) => {
        setAvailability(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await skillsAPI.addSkillHave({
                name: skillName,
                category,
                level: level || 'Beginner',
                description,
                availability: availability.join(', '),
                cost: skillCoinCost
            });
            navigate('/profile');
        } catch (err) {
            console.error("Failed to publish skill", err);
            alert("Failed to publish skill. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teach-container">
            <div className="teach-header">
                <button className="back-btn-teach" onClick={() => navigate('/dashboard')}>
                    &larr; Dashboard
                </button>
                <h1 className="teach-page-title">Share Your Knowledge 🎓</h1>
                <p className="teach-tagline">Help others level up by sharing what you know.</p>
            </div>

            <div className="teach-form-card">
                <form className="teach-form" onSubmit={handlePublish}>

                    {/* Skill Name */}
                    <div className="form-group">
                        <label className="form-label">Skill Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. React.js for Beginners"
                            value={skillName}
                            onChange={e => setSkillName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category + Level */}
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label className="form-label">Skill Category</label>
                            <select
                                className="form-input"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                required
                            >
                                <option value="" disabled>Choose category</option>
                                {SKILL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group half-width">
                            <label className="form-label">Skill Level</label>
                            <div className="level-selector">
                                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        className={`level-btn ${level === lvl ? `level-btn--active level-${lvl.toLowerCase()}` : ''}`}
                                        onClick={() => setLevel(lvl)}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Short Description</label>
                        <textarea
                            className="form-input textarea"
                            placeholder="Describe what learners will gain from your sessions..."
                            rows="4"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    {/* Duration + Cost */}
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label className="form-label">Session Duration</label>
                            <select
                                className="form-input"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                            >
                                <option value="30 min">30 min</option>
                                <option value="1 hour">1 hour</option>
                                <option value="2 hours">2 hours</option>
                            </select>
                        </div>

                        <div className="form-group half-width">
                            <label className="form-label">SkillCoin Cost per Session 💰</label>
                            <input
                                type="number"
                                className="form-input"
                                min={1}
                                max={20}
                                value={skillCoinCost}
                                onChange={e => setSkillCoinCost(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="form-group">
                        <label className="form-label">Availability</label>
                        <p className="form-hint">Select days you are typically available.</p>
                        <div className="availability-grid">
                            {AVAILABILITY_OPTIONS.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    className={`day-btn ${availability.includes(day) ? 'day-btn--active' : ''}`}
                                    onClick={() => toggleDay(day)}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="teach-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate('/dashboard')}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="publish-btn"
                            disabled={loading}
                        >
                            {loading ? "Publishing... ✨" : "Publish Skill 🚀"}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default TeachSkillPage;
