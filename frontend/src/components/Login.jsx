import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function Login({ onSuccess }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            // credentialResponse.credential is the Google ID token (JWT from Google)
            const res = await axios.post(`${BACKEND_URL}/auth/google`, {
                token: credentialResponse.credential,
            });
            // res.data = { token: <our JWT>, user: { ...userFields } }
            onSuccess(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">🌸</div>
                <h1 className="login-title">PinkMentor</h1>
                <p className="login-subtitle">Connect. Learn. Grow.</p>

                {error && <p className="error-msg">{error}</p>}

                <div className="google-btn-wrapper">
                    {loading ? (
                        <p className="loading-text">Signing in...</p>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in was cancelled or failed.')}
                            useOneTap={false}
                            text="signin_with"
                            shape="rectangular"
                            theme="outline"
                            size="large"
                        />
                    )}
                </div>

                <p className="login-hint">
                    By signing in, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}

export default Login;
