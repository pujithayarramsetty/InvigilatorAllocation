import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './DepartmentExams.css';

const DepartmentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const fetchExams = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/exam-controller/exams?${params.toString()}`);
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <div className="department-exams">
      <div className="page-header">
        <h2>Department Exams</h2>
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End Date"
          />
        </div>
      </div>

      <div className="exams-table">
        {exams.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id}>
                  <td>{exam.subject}</td>
                  <td>{new Date(exam.examDate).toLocaleDateString()}</td>
                  <td>{exam.startTime} - {exam.endTime}</td>
                  <td>{exam.room}</td>
                  <td>
                    <span className={`status-badge ${exam.status}`}>
                      {exam.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No exams found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentExams;

