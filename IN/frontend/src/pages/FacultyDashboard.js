import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import FacultyHome from '../components/faculty/FacultyHome';
import MyDuties from '../components/faculty/MyDuties';
import ChangeRequests from '../components/faculty/ChangeRequests';
import FacultyProfile from '../components/faculty/FacultyProfile';
import './FacultyDashboard.css';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="faculty-dashboard">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📅 Schedulo</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ×
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/faculty" className={`nav-item ${isActive('/faculty') && !location.pathname.includes('/faculty/') ? 'active' : ''}`}>
            <span>🏠</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/faculty/duties" className={`nav-item ${isActive('/faculty/duties') ? 'active' : ''}`}>
            <span>📋</span>
            <span>My Duties</span>
          </Link>
          <Link to="/faculty/requests" className={`nav-item ${isActive('/faculty/requests') ? 'active' : ''}`}>
            <span>📝</span>
            <span>Change Requests</span>
          </Link>
          <Link to="/faculty/profile" className={`nav-item ${isActive('/faculty/profile') ? 'active' : ''}`}>
            <span>👤</span>
            <span>My Profile</span>
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-danger">
            <span>🚪</span>
            <span>Logout</span>
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
              Welcome, {user?.name || 'Faculty'}
              <span className="user-role"> ({user?.role || 'faculty'})</span>
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
            <Route path="/" element={<FacultyHome />} />
            <Route path="/duties" element={<MyDuties />} />
            <Route path="/requests" element={<ChangeRequests />} />
            <Route path="/profile" element={<FacultyProfile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;

