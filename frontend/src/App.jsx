import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import RecruiterPage from './pages/RecruiterPage';
import FindMentorPage from './pages/FindMentorPage';
import SessionBookingPage from './pages/SessionBookingPage';
import SessionChatPage from './pages/SessionChatPage';
import ProfilePage from './pages/ProfilePage';
import TeachSkillPage from './pages/TeachSkillPage';
import MySessionsPage from './pages/MySessionsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/recruiters" element={
            <ProtectedRoute><RecruiterPage /></ProtectedRoute>
          } />
          <Route path="/find" element={
            <ProtectedRoute><FindMentorPage /></ProtectedRoute>
          } />
          <Route path="/session/:mentorId" element={
            <ProtectedRoute><SessionBookingPage /></ProtectedRoute>
          } />
          <Route path="/chat/:sessionId" element={
            <ProtectedRoute><SessionChatPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/teach" element={
            <ProtectedRoute><TeachSkillPage /></ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute><MySessionsPage /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
