import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount: check if a JWT is stored and re-fetch user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        axios
            .get(`${BACKEND_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setUser(res.data.user))
            .catch(() => localStorage.removeItem('token')) // token invalid/expired
            .finally(() => setLoading(false));
    }, []);

    const handleLoginSuccess = ({ token, user }) => {
        localStorage.setItem('token', token);
        setUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    if (loading) {
        return <div className="centered">Loading...</div>;
    }

    return (
        <div className="app">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} />
            ) : (
                <Login onSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
