import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import './AdminHome.css';

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState({ type: null, data: [] });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          endpoint = '/api/admin/exams';
          break;
        case 'faculty':
          endpoint = '/api/admin/faculty';
          break;
        case 'classrooms':
          endpoint = '/api/admin/classrooms';
          break;
        case 'allocations':
          navigate('/admin/allocation');
          setModalLoading(false);
          return;
        case 'requests':
          endpoint = '/api/admin/change-requests';
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

  return (
    <div className="admin-home">
      <h1>Admin Dashboard</h1>
      
      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card clickable" onClick={() => handleCardClick('exams')}>
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>{stats.stats.totalExams}</h3>
                <p>Total Exams</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('faculty')}>
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.stats.totalFaculty}</h3>
                <p>Total Faculty</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('classrooms')}>
              <div className="stat-icon">🏫</div>
              <div className="stat-info">
                <h3>{stats.stats.totalClassrooms}</h3>
                <p>Classrooms</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('allocations')}>
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.stats.totalAllocations}</h3>
                <p>Allocations</p>
              </div>
            </div>
            
            <div className="stat-card clickable" onClick={() => handleCardClick('requests')}>
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.stats.pendingRequests}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="section-card">
              <h2>Upcoming Exams</h2>
              {stats.upcomingExams && stats.upcomingExams.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Exam Name</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingExams.map((exam) => (
                      <tr key={exam._id}>
                        <td>{exam.examName}</td>
                        <td>{new Date(exam.examDate).toLocaleDateString()}</td>
                        <td>{exam.startTime} - {exam.endTime}</td>
                        <td>{exam.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No upcoming exams</p>
              )}
            </div>

            <div className="section-card">
              <h2>Recent Allocations</h2>
              {stats.recentAllocations && stats.recentAllocations.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Faculty</th>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAllocations.map((alloc) => (
                      <tr key={alloc._id}>
                        <td>{alloc.invigilator?.name}</td>
                        <td>{alloc.exam?.examName}</td>
                        <td>{new Date(alloc.date).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${alloc.status === 'assigned' ? 'info' : 'success'}`}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No recent allocations</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal for displaying detailed data */}
      {modalData.type && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalData.type === 'exams' && '📚 All Exams'}
                {modalData.type === 'faculty' && '👥 All Faculty'}
                {modalData.type === 'classrooms' && '🏫 All Classrooms'}
                {modalData.type === 'requests' && '⏳ Change Requests'}
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
                          <th>Department</th>
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
                            <td>{exam.department || 'N/A'}</td>
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
                          <th>Department</th>
                          <th>Designation</th>
                          <th>Campus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.data.map((faculty) => (
                          <tr key={faculty._id}>
                            <td>{faculty.name}</td>
                            <td>{faculty.email}</td>
                            <td>{faculty.employeeId || 'N/A'}</td>
                            <td>{faculty.department || 'N/A'}</td>
                            <td>{faculty.designation || 'N/A'}</td>
                            <td>{faculty.campus || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {modalData.type === 'classrooms' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Room Number</th>
                          <th>Building</th>
                          <th>Capacity</th>
                          <th>Campus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.data.map((classroom) => (
                          <tr key={classroom._id}>
                            <td>{classroom.roomNumber}</td>
                            <td>{classroom.building || 'N/A'}</td>
                            <td>{classroom.capacity || 'N/A'}</td>
                            <td>{classroom.campus || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {modalData.type === 'requests' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Requester</th>
                          <th>Exam</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Requested Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.data.map((request) => (
                          <tr key={request._id}>
                            <td>{request.requester?.name || 'N/A'}</td>
                            <td>{request.allocation?.exam?.examName || 'N/A'}</td>
                            <td>{request.reason || 'N/A'}</td>
                            <td>
                              <span className={`badge badge-${request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>{new Date(request.createdAt).toLocaleDateString()}</td>
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

export default AdminHome;

