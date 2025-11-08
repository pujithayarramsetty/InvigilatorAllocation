import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import './FacultyHome.css';

const FacultyHome = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState({ type: null, data: [] });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchDashboard();
    };
    
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/api/faculty/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDutyLetter = async () => {
    try {
      const response = await api.get('/api/reports/pdf/my-duties', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'duty-letter.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading duty letter:', error);
    }
  };

  const handleCardClick = async (type) => {
    setModalLoading(true);
    setModalData({ type, data: [] });

    try {
      switch (type) {
        case 'duties':
          navigate('/faculty/duties');
          setModalLoading(false);
          return;
        case 'requests':
          navigate('/faculty/requests');
          setModalLoading(false);
          return;
        default:
          setModalLoading(false);
          return;
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
      setModalData({ type: null, data: [] });
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalData({ type: null, data: [] });
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <div className="faculty-home">
      <div className="faculty-header">
        <h1>My Dashboard</h1>
        <button onClick={handleDownloadDutyLetter} className="btn btn-primary">
          📄 Download Duty Letter
        </button>
      </div>

      {dashboard && (
        <>
          <div className="stats-grid">
            <div className="stat-card clickable" onClick={() => handleCardClick('duties')}>
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{dashboard.totalDuties}</h3>
                <p>Total Duties</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('duties')}>
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>{dashboard.upcomingDuties}</h3>
                <p>Upcoming Duties</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('duties')}>
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{dashboard.pastDuties}</h3>
                <p>Completed Duties</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('requests')}>
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <h3>{dashboard.pendingRequests}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="upcoming-duties">
            <h2>Upcoming Duties</h2>
            {dashboard.duties && dashboard.duties.filter(d => new Date(d.date) >= new Date()).slice(0, 5).length > 0 ? (
              <div className="duties-list">
                {dashboard.duties
                  .filter(d => new Date(d.date) >= new Date())
                  .slice(0, 5)
                  .map((duty) => (
                    <div key={duty._id} className="duty-card">
                      <div className="duty-date">
                        <div className="date-day">{new Date(duty.date).getDate()}</div>
                        <div className="date-month">{new Date(duty.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                      </div>
                      <div className="duty-info">
                        <h3>{duty.exam?.examName || duty.exam?.subject}</h3>
                        <p>📅 {new Date(duty.date).toLocaleDateString()}</p>
                        <p>⏰ {duty.startTime} - {duty.endTime}</p>
                        <p>🏫 {duty.room}</p>
                      </div>
                      <div className="duty-status">
                        <span className={`badge badge-${duty.status === 'assigned' ? 'info' : 'success'}`}>
                          {duty.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No upcoming duties</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyHome;

