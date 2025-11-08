import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import './ExamControllerHome.css';

const ExamControllerHome = () => {
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
      const response = await api.get('/api/exam-controller/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (type) => {
    setModalLoading(true);
    setModalData({ type, data: [] });

    try {
      let endpoint = '';
      switch (type) {
        case 'exams':
          endpoint = '/api/exam-controller/exams';
          break;
        case 'allocations':
          navigate('/exam-controller/allocations');
          setModalLoading(false);
          return;
        case 'requests':
          navigate('/exam-controller/requests');
          setModalLoading(false);
          return;
        case 'faculty':
          endpoint = '/api/exam-controller/faculty';
          break;
        default:
          setModalLoading(false);
          return;
      }

      const response = await api.get(endpoint);
      setModalData({ type, data: response.data });
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setModalData({ type: null, data: [] });
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalData({ type: null, data: [] });
  };

  if (loading) {
    return <div className="spinner" />;
  }

  if (!dashboard) {
    return <div className="error-message">Failed to load dashboard</div>;
  }

  return (
    <div className="exam-controller-home">
      <div className="welcome-section">
        <h2>Welcome, Exam Controller!</h2>
        <p>Manage exams and allocations for <strong>{dashboard.department}</strong> department</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => handleCardClick('exams')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{dashboard.stats.totalExams}</h3>
            <p>Total Exams</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => handleCardClick('allocations')}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{dashboard.stats.totalAllocations}</h3>
            <p>Allocations</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => handleCardClick('requests')}>
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{dashboard.stats.pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => handleCardClick('faculty')}>
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>{dashboard.stats.totalFaculty}</h3>
            <p>Faculty Members</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h3>Recent Exams</h3>
          {dashboard.recentExams.length > 0 ? (
            <div className="exam-list">
              {dashboard.recentExams.map((exam, idx) => (
                <div key={idx} className="exam-item">
                  <div className="exam-info">
                    <strong>{exam.subject}</strong>
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="exam-time">
                    {exam.startTime} - {exam.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No exams scheduled</p>
          )}
        </div>

        <div className="section-card">
          <h3>Pending Change Requests</h3>
          {dashboard.changeRequests.length > 0 ? (
            <div className="request-list">
              {dashboard.changeRequests.map((request, idx) => (
                <div key={idx} className="request-item">
                  <div className="request-info">
                    <strong>{request.requester?.name}</strong>
                    <span>{request.exam?.subject}</span>
                  </div>
                  <div className="request-status pending">Pending</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No pending requests</p>
          )}
        </div>
      </div>

      {/* Modal for displaying detailed data */}
      {modalData.type && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalData.type === 'exams' && '📚 Department Exams'}
                {modalData.type === 'faculty' && '👥 Department Faculty'}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="spinner" />
              ) : modalData.data.length > 0 ? (
                <div className="modal-table-container">
                  {modalData.type === 'exams' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Exam Name</th>
                          <th>Subject</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.data.map((exam) => (
                          <tr key={exam._id}>
                            <td>{exam.examName}</td>
                            <td>{exam.subject}</td>
                            <td>{new Date(exam.examDate).toLocaleDateString()}</td>
                            <td>{exam.startTime} - {exam.endTime}</td>
                            <td>{exam.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {modalData.type === 'faculty' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Employee ID</th>
                          <th>Designation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.data.map((faculty) => (
                          <tr key={faculty._id}>
                            <td>{faculty.name}</td>
                            <td>{faculty.email}</td>
                            <td>{faculty.employeeId || 'N/A'}</td>
                            <td>{faculty.designation || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <p className="no-data">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamControllerHome;

