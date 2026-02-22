import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import './ProfilePage.css';
import { useAuth } from '../context/AuthContext';
import { skillsAPI, sessionsAPI } from '../api/api';

const BLANK_FORM = { title: '', github: '', demo: '', description: '' };

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [skills, setSkills] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openForm, setOpenForm] = useState(null); // which skill has form open
    const [forms, setForms] = useState({});    // per-skill form state

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [skillsRes, sessionsRes] = await Promise.all([
                    skillsAPI.getMySkills(),
                    sessionsAPI.getSessions()
                ]);
                setSkills(skillsRes.data.skillsHave || []);
                setHistory(sessionsRes.data.sessions || []);
            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const updateForm = (skillId, field, value) => {
        setForms(prev => ({
            ...prev,
            [skillId]: { ...(prev[skillId] || BLANK_FORM), [field]: value }
        }));
    };

    const handleAddProject = async (skillId) => {
        const form = forms[skillId] || BLANK_FORM;
        if (!form.title.trim()) return;

        try {
            const skillToUpdate = skills.find(s => s._id === skillId);
            const updatedProofLinks = [...(skillToUpdate.proofLinks || []), {
                title: form.title.trim(),
                url: form.github.trim() || form.demo.trim() || 'No link provided',
                description: form.description.trim()
            }];

            const res = await skillsAPI.updateSkillHave(skillId, { proofLinks: updatedProofLinks });
            setSkills(prev => prev.map(s => s._id === skillId ? res.data.skill : s));
            setForms(prev => ({ ...prev, [skillId]: BLANK_FORM }));
            setOpenForm(null);
        } catch (err) {
            console.error("Failed to add project", err);
            alert("Failed to add project. Please try again.");
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!window.confirm("Are you sure you want to remove this skill?")) return;
        try {
            await skillsAPI.deleteSkillHave(skillId);
            setSkills(prev => prev.filter(s => s._id !== skillId));
        } catch (err) {
            console.error("Failed to delete skill", err);
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
                Loading profile... 🎀
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header-container">
                <button className="back-btn-profile" onClick={() => navigate('/dashboard')}>
                    &larr; Dashboard
                </button>
                <h1 className="profile-page-title">My Profile <span className="logo-icon">🎀</span></h1>
            </div>

            <div className="profile-content">
                <div className="profile-info-section">
                    <div className="profile-card">
                        <div className="profile-image-wrapper">
                            <img src={user?.photo} alt="Profile" className="profile-image" />
                        </div>
                        <h2 className="profile-name">{user?.name}</h2>
                        <p className="profile-bio">{user?.bio || "No bio yet. Tell the community about yourself!"}</p>

                        <div className="profile-stats">
                            <div className="stat-box">
                                <span className="stat-value">{user?.coins || 0} 💰</span>
                                <span className="stat-label">SkillCoins</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-value">⭐ {user?.reputation?.toFixed(1) || '0.0'}</span>
                                <span className="stat-label">Reputation</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-value">✅ {(user?.sessionsTaught || 0) + (user?.sessionsLearned || 0)}</span>
                                <span className="stat-label">Sessions</span>
                            </div>
                        </div>

                        <Button variant="primary" className="edit-profile-btn" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>

                <div className="profile-details-section">
                    <div className="content-card skills-card">
                        <div className="skills-section-header">
                            <h3 className="section-title">My Skills</h3>
                            <button className="add-skill-global-btn" onClick={() => navigate('/teach')}>＋ Add New Skill</button>
                        </div>

                        <div className="skills-list">
                            {skills.map(skill => {
                                const skillProjects = skill.proofLinks || [];
                                const hasProjects = skillProjects.length > 0;
                                const isFormOpen = openForm === skill._id;
                                const form = forms[skill._id] || BLANK_FORM;

                                return (
                                    <div key={skill._id} className={`skill-block ${hasProjects ? 'skill-block--verified' : ''}`}>
                                        <div className="skill-block-top">
                                            <div className="skill-block-info">
                                                <div className="skill-header">
                                                    <h4 className="skill-name">{skill.name}</h4>
                                                    <div className="skill-header-badges">
                                                        {skill.verified && <span className="verified-badge" title="Verified Skill">✓</span>}
                                                        {hasProjects && <span className="work-verified-badge">Work Verified ✔</span>}
                                                        <button className="delete-skill-btn" onClick={() => handleDeleteSkill(skill._id)} title="Remove Skill">🗑️</button>
                                                    </div>
                                                </div>
                                                <div className="skill-meta">
                                                    <span className={`level-badge level-${skill.level.toLowerCase()}`}>{skill.level}</span>
                                                    <span className="taught-badge">Taught: {skill.sessionsTaught || 0}</span>
                                                    <span className="projects-count-badge">{skillProjects.length} Project{skillProjects.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="projects-section">
                                            <div className="projects-section-header">
                                                <h5 className="projects-section-title">Portfolio & Proof</h5>
                                                <button
                                                    className="toggle-form-btn"
                                                    onClick={() => setOpenForm(isFormOpen ? null : skill._id)}
                                                >
                                                    {isFormOpen ? '✕ Cancel' : '＋ Add Proof'}
                                                </button>
                                            </div>

                                            {hasProjects && (
                                                <div className="project-cards-list">
                                                    {skillProjects.map((proj, idx) => (
                                                        <div key={idx} className="project-card">
                                                            <div className="project-card-body">
                                                                <h6 className="project-title">{proj.title}</h6>
                                                                <p className="project-desc">{proj.description}</p>
                                                                <div className="project-links">
                                                                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="project-link generic-link">
                                                                        🔗 View Link
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {!hasProjects && !isFormOpen && (
                                                <p className="no-projects-hint">No proof yet. Add links to projects to get verified faster!</p>
                                            )}

                                            {isFormOpen && (
                                                <div className="add-project-form">
                                                    <input
                                                        type="text"
                                                        className="project-form-input"
                                                        placeholder="Project Title (e.g. My Flutter App)"
                                                        value={form.title}
                                                        onChange={e => updateForm(skill._id, 'title', e.target.value)}
                                                    />
                                                    <input
                                                        type="url"
                                                        className="project-form-input"
                                                        placeholder="Link (GitHub, Behance, etc.)"
                                                        value={form.github}
                                                        onChange={e => updateForm(skill._id, 'github', e.target.value)}
                                                    />
                                                    <textarea
                                                        className="project-form-input project-form-textarea"
                                                        placeholder="Short description..."
                                                        rows={2}
                                                        value={form.description}
                                                        onChange={e => updateForm(skill._id, 'description', e.target.value)}
                                                    />
                                                    <button
                                                        className="add-project-btn"
                                                        onClick={() => handleAddProject(skill._id)}
                                                        disabled={!form.title.trim()}
                                                    >
                                                        Save Proof 🚀
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {skills.length === 0 && <p className="no-skills-msg">You haven't listed any skills yet. Go to "Teach a Skill" to add some! 📚</p>}
                        </div>
                    </div>

                    <div className="content-card history-card">
                        <h3 className="section-title">Recent Session Activities</h3>
                        <div className="history-list">
                            {history.slice(0, 10).map(sess => {
                                const isTeacher = sess.teacherId?._id === user?._id;
                                return (
                                    <div key={sess._id} className="history-item">
                                        <div className="history-main">
                                            <span className="history-skill">{sess.skill}</span>
                                            <span className={`history-role role-${isTeacher ? 'mentor' : 'learner'}`}>
                                                {isTeacher ? 'Mentor' : 'Learner'}
                                            </span>
                                        </div>
                                        <div className="history-details">
                                            <span className="history-date">{sess.timeSlot}</span>
                                            <span className="history-status">{sess.status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {history.length === 0 && <p className="empty-msg">No session history yet. Start learning! 🚀</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
