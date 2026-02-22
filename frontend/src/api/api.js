import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    googleLogin: (token) => api.post('/auth/google', { token }),
    getMe: () => api.get('/auth/me'),
    getUserProfile: (id) => api.get(`/auth/user/${id}`),
};

export const skillsAPI = {
    getMySkills: () => api.get('/skills'),
    addSkillHave: (data) => api.post('/skills/have', data),
    updateSkillHave: (id, data) => api.patch(`/skills/have/${id}`, data),
    deleteSkillHave: (id) => api.delete(`/skills/have/${id}`),
    addSkillWant: (name) => api.post('/skills/want', { name }),
    deleteSkillWant: (name) => api.delete(`/skills/want/${name}`),
};

export const matchAPI = {
    getMatches: () => api.get('/match'),
};

export const sessionsAPI = {
    getSessions: () => api.get('/sessions'),
    getSession: (id) => api.get(`/sessions/${id}`),
    createSession: (data) => api.post('/sessions', data),
    acceptSession: (id) => api.patch(`/sessions/${id}/accept`),
    rejectSession: (id) => api.patch(`/sessions/${id}/reject`),
    confirmSession: (id) => api.patch(`/sessions/${id}/confirm`),
    cancelSession: (id) => api.patch(`/sessions/${id}/cancel`),
    rateSession: (id, rating) => api.patch(`/sessions/${id}/rate`, { rating }),
};

export default api;
