import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './Allocation.css';

const Allocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    maxHoursPerDay: 4,
    noSameDayRepetition: true,
    departmentBased: false,
    campus: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAllocations();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchAllocations();
    };
    
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  const fetchAllocations = async () => {
    try {
      const response = await api.get('/api/allocation');
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/api/allocation/generate', { config });
      setMessage({
        type: 'success',
        text: `Allocations generated successfully! ${response.data.count} allocations created.`
      });
      await fetchAllocations();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate allocations'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await api.put(`/api/allocation/${id}`, updates);
      await fetchAllocations();
      setMessage({ type: 'success', text: 'Allocation updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update allocation' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) {
      return;
    }

    try {
      await api.delete(`/api/allocation/${id}`);
      await fetchAllocations();
      setMessage({ type: 'success', text: 'Allocation deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete allocation' });
    }
  };

  return (
    <div className="allocation-page">
      <h1>Invigilator Allocation</h1>

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
            <div className="input-group">
              <label>Campus Filter (Optional)</label>
              <input
                type="text"
                value={config.campus}
                onChange={(e) => setConfig({ ...config, campus: e.target.value })}
                placeholder="Leave empty for all campuses"
              />
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
          <p>No allocations found. Generate allocations to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Allocation;

