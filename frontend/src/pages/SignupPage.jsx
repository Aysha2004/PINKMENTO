import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import './SignupPage.css';

const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = (e) => {
        e.preventDefault();
        console.log("User signed up");
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-header">
                    <h1 className="app-title">Create Your Pink Mentor Account <span className="logo-icon">🎀</span></h1>
                    <p className="app-tagline">Learn. Teach. Grow Together.</p>
                </div>

                <form className="signup-form" onSubmit={handleSignup}>
                    <Input
                        label="Full Name"
                        type="text"
                        id="fullName"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        id="email"
                        placeholder="hello@pinkmentor.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        id="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        id="confirmPassword"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <div className="action-buttons">
                        <Button type="submit" variant="primary">
                            Sign Up
                        </Button>
                    </div>
                </form>

                <div className="signup-footer">
                    <Link to="/" className="login-link">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
