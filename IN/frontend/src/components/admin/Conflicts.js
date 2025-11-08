import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './Conflicts.css';

const Conflicts = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    campus: '',
    department: '',
    dateFrom: '',
    dateTo: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.campus) params.append('campus', filters.campus);
      if (filters.department) params.append('department', filters.department);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await api.get(`/api/conflicts/detect?${params.toString()}`);
      setConflicts(response.data.conflicts);
      setStats({
        total: response.data.totalConflicts,
        high: response.data.highSeverity,
        medium: response.data.mediumSeverity
      });
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictIds) => {
    try {
      const response = await api.post('/api/conflicts/resolve', { conflictIds });
      alert('Resolution suggestions generated. Check console for details.');
      console.log(response.data);
    } catch (error) {
      console.error('Error resolving conflicts:', error);
    }
  };

  return (
    <div className="conflicts-page">
      <div className="conflicts-header">
        <h1>🔍 Smart Conflict Detector</h1>
        <button onClick={fetchConflicts} className="btn btn-primary" disabled={loading}>
          {loading ? 'Scanning...' : '🔍 Scan for Conflicts'}
        </button>
      </div>

      {stats && (
        <div className="conflict-stats">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Conflicts</p>
          </div>
          <div className="stat-card high-severity">
            <h3>{stats.high}</h3>
            <p>High Severity</p>
          </div>
          <div className="stat-card medium-severity">
            <h3>{stats.medium}</h3>
            <p>Medium Severity</p>
          </div>
        </div>
      )}

      <div className="conflict-filters">
        <div className="filter-group">
          <label>Campus</label>
          <input
            type="text"
            value={filters.campus}
            onChange={(e) => setFilters({ ...filters, campus: e.target.value })}
            placeholder="Filter by campus"
          />
        </div>
        <div className="filter-group">
          <label>Department</label>
          <input
            type="text"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            placeholder="Filter by department"
          />
        </div>
        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        <button onClick={fetchConflicts} className="btn btn-secondary">
          Apply Filters
        </button>
      </div>

      <div className="conflicts-list">
        <h2>Detected Conflicts</h2>
        {loading ? (
          <div className="spinner" />
        ) : conflicts.length > 0 ? (
          <div className="conflicts-table">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Faculty</th>
                  <th>Date</th>
                  <th>Conflict Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((conflict, index) => (
                  <tr key={index} className={`conflict-row ${conflict.severity}`}>
                    <td>
                      <span className={`badge badge-${conflict.severity === 'high' ? 'error' : 'warning'}`}>
                        {conflict.severity}
                      </span>
                    </td>
                    <td>{conflict.faculty || 'N/A'}</td>
                    <td>{conflict.date ? new Date(conflict.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="conflict-details">
                        {conflict.allocation1 && (
                          <div>
                            <strong>{conflict.allocation1.exam}</strong> - {conflict.allocation1.time} ({conflict.allocation1.room})
                          </div>
                        )}
                        {conflict.allocation2 && (
                          <div>
                            <strong>{conflict.allocation2.exam}</strong> - {conflict.allocation2.time} ({conflict.allocation2.room})
                          </div>
                        )}
                        {conflict.message && <p>{conflict.message}</p>}
                      </div>
                    </td>
                    <td>
                      {conflict.allocation1 && conflict.allocation2 && (
                        <button
                          onClick={() => handleResolve([conflict.allocation1.id, conflict.allocation2.id])}
                          className="btn btn-sm btn-primary"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-conflicts">
            <p>✅ No conflicts detected! All allocations are conflict-free.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conflicts;

