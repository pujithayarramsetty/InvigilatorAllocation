import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './DepartmentAllocations.css';

const DepartmentAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [exams, setExams] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    maxHoursPerDay: 4,
    noSameDayRepetition: true,
    departmentBased: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    totalExams: 0,
    totalFaculty: 0,
    totalAllocations: 0
  });

  useEffect(() => {
    fetchAllData();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchAllData();
    };
    
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAllocations(),
      fetchExams(),
      fetchFaculty()
    ]);
  };

  const fetchAllocations = async () => {
    try {
      const response = await api.get('/api/exam-controller/allocations');
      setAllocations(response.data);
      setStats(prev => ({ ...prev, totalAllocations: response.data.length }));
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/api/exam-controller/exams');
      setExams(response.data);
      setStats(prev => ({ ...prev, totalExams: response.data.length }));
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/api/exam-controller/faculty');
      setFaculty(response.data);
      setStats(prev => ({ ...prev, totalFaculty: response.data.length }));
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Generating allocations with config:', config);
      const response = await api.post('/api/exam-controller/allocations/generate', { config });
      console.log('Allocation response:', response.data);
      
      const conflictMsg = response.data.conflictsDetected > 0 
        ? ` (${response.data.conflictsDetected} conflicts detected)` 
        : '';
      setMessage({
        type: 'success',
        text: `Allocations generated successfully! ${response.data.count} allocations created.${conflictMsg}`
      });
      await fetchAllData();
    } catch (error) {
      console.error('Allocation generation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = error.response?.data?.message || 'Failed to generate allocations';
      
      // Add helpful context
      if (errorMessage.includes('No exams found')) {
        errorMessage += '\n\n💡 Tip: Upload exam timetable first from the Uploads page.';
      } else if (errorMessage.includes('No faculty')) {
        errorMessage += '\n\n💡 Tip: Upload faculty data first from the Uploads page.';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) {
      return;
    }

    try {
      await api.delete(`/api/exam-controller/allocations/${id}`);
      await fetchAllocations();
      setMessage({ type: 'success', text: 'Allocation deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete allocation' });
    }
  };

  return (
    <div className="allocation-page">
      <h1>Department Invigilator Allocation</h1>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📚
          </div>
          <div className="stat-content">
            <h3>{stats.totalExams}</h3>
            <p>Total Exams</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👥
          </div>
          <div className="stat-content">
            <h3>{stats.totalFaculty}</h3>
            <p>Faculty Members</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            ✅
          </div>
          <div className="stat-content">
            <h3>{stats.totalAllocations}</h3>
            <p>Allocations</p>
          </div>
        </div>
      </div>

      <div className="allocation-controls">
        <div className="config-card">
          <h2>Allocation Configuration</h2>
          <div className="config-options">
            <div className="input-group">
              <label>Max Hours Per Day</label>
              <input
                type="number"
                value={config.maxHoursPerDay}
                onChange={(e) => setConfig({ ...config, maxHoursPerDay: parseInt(e.target.value) })}
                min="1"
                max="8"
              />
            </div>
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.noSameDayRepetition}
                  onChange={(e) => setConfig({ ...config, noSameDayRepetition: e.target.checked })}
                />
                No Same Day Repetition
              </label>
            </div>
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.departmentBased}
                  onChange={(e) => setConfig({ ...config, departmentBased: e.target.checked })}
                />
                Department-Based Allocation
              </label>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Allocations'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="allocations-table">
        <h2>Allocations ({allocations.length})</h2>
        {allocations.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Department</th>
                  <th>Exam</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc._id}>
                    <td>{alloc.invigilator?.name}</td>
                    <td>{alloc.invigilator?.department}</td>
                    <td>{alloc.exam?.examName || alloc.exam?.subject}</td>
                    <td>{new Date(alloc.date).toLocaleDateString()}</td>
                    <td>{alloc.startTime} - {alloc.endTime}</td>
                    <td>{alloc.campus || alloc.exam?.campus || 'N/A'}</td>
                    <td>{alloc.room}</td>
                    <td>
                      <span className={`badge badge-${alloc.status === 'assigned' ? 'info' : 'success'}`}>
                        {alloc.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(alloc._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No allocations found. Generate allocations to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentAllocations;

