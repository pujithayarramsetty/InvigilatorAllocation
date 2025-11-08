import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ExamControllerHome from '../components/examController/ExamControllerHome';
import DepartmentExams from '../components/examController/DepartmentExams';
import DepartmentAllocations from '../components/examController/DepartmentAllocations';
import Uploads from '../components/examController/Uploads';
import ChangeRequests from '../components/examController/ChangeRequests';
import ExamControllerProfile from '../components/examController/ExamControllerProfile';
import './ExamControllerDashboard.css';

const ExamControllerDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="exam-controller-dashboard">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>📅 Schedulo</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/exam-controller" 
            className={isActive('/exam-controller') && !isActive('/exam-controller/exams') && !isActive('/exam-controller/allocations') && !isActive('/exam-controller/requests') ? 'active' : ''}
          >
            🏠 Dashboard
          </Link>
          <Link 
            to="/exam-controller/exams" 
            className={isActive('/exam-controller/exams') ? 'active' : ''}
          >
            📋 Department Exams
          </Link>
          <Link 
            to="/exam-controller/uploads" 
            className={isActive('/exam-controller/uploads') ? 'active' : ''}
          >
            📤 Uploads
          </Link>
          <Link 
            to="/exam-controller/allocations" 
            className={isActive('/exam-controller/allocations') ? 'active' : ''}
          >
            👥 Allocations
          </Link>
          <Link 
            to="/exam-controller/requests" 
            className={isActive('/exam-controller/requests') ? 'active' : ''}
          >
            🔄 Change Requests
            {notifications.filter(n => n.type === 'info' && n.message?.includes('request')).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => n.type === 'info' && n.message?.includes('request')).length}
              </span>
            )}
          </Link>
          <Link 
            to="/exam-controller/profile" 
            className={isActive('/exam-controller/profile') ? 'active' : ''}
          >
            👤 My Profile
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p><strong>{user?.name}</strong></p>
            <p className="user-role">🎓 Exam Controller</p>
            <p className="user-dept">{user?.department}</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className="topbar-left">
            <h3 className="welcome-name">
              Welcome, {user?.name || 'Exam Controller'}
              <span className="user-role"> ({user?.role || 'examController'})</span>
            </h3>
          </div>
          <div className="topbar-right">
            {notifications.length > 0 && (
              <button className="notification-button">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2C6.686 2 4 4.686 4 8V13.586L2.293 15.293C2.105 15.481 2 15.735 2 16C2 16.553 2.447 17 3 17H17C17.553 17 18 16.553 18 16C18 15.735 17.895 15.481 17.707 15.293L16 13.586V8C16 4.686 13.314 2 10 2Z" fill="currentColor"/>
                </svg>
                {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
              </button>
            )}
          </div>
        </header>

        {notifications.length > 0 && (
          <div className="notifications-panel">
            <div className="notifications-header">
              <h4>Notifications ({notifications.length})</h4>
              <button 
                className="clear-all-btn"
                onClick={clearNotifications}
              >
                Clear All
              </button>
            </div>
            <div className="notifications-list">
              {notifications.map((notif, index) => (
                <div 
                  key={index} 
                  className={`notification-item notification-${notif.type === 'error' ? 'error' : notif.type === 'success' ? 'success' : 'info'}`}
                >
                  <div className="notification-icon-wrapper">
                    {notif.type === 'success' && <span className="notification-icon">✓</span>}
                    {notif.type === 'error' && <span className="notification-icon">✕</span>}
                    {notif.type === 'info' && <span className="notification-icon">ℹ</span>}
                    {!notif.type && <span className="notification-icon">ℹ</span>}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <button 
                    className="notification-close"
                    onClick={() => removeNotification(index)}
                    aria-label="Close notification"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content-area">
          <Routes>
            <Route path="/" element={<ExamControllerHome />} />
            <Route path="/exams" element={<DepartmentExams />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/allocations" element={<DepartmentAllocations />} />
            <Route path="/requests" element={<ChangeRequests />} />
            <Route path="/profile" element={<ExamControllerProfile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default ExamControllerDashboard;

