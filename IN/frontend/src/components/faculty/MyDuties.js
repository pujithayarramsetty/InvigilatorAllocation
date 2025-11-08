import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MyDuties.css';

const MyDuties = () => {
  const [duties, setDuties] = useState([]);
  const [view, setView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDuties();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchDuties();
    };
    
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, [view]);

  const fetchDuties = async () => {
    try {
      const response = await api.get(`/api/faculty/duties?view=${view}`);
      setDuties(response.data);
    } catch (error) {
      console.error('Error fetching duties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDutiesForDate = (date) => {
    return duties.filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayDuties = getDutiesForDate(date);
      if (dayDuties.length > 0) {
        return <div className="calendar-duty-marker">{dayDuties.length}</div>;
      }
    }
    return null;
  };

  const handleExportCalendar = async () => {
    try {
      const response = await api.get('/api/calendar/export/ical', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invigilation-schedule.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting calendar:', error);
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <div className="my-duties-page">
      <div className="duties-header">
        <h1>My Duties</h1>
        <div className="duties-header-actions">
          <button onClick={handleExportCalendar} className="btn btn-primary">
            📅 Export to Calendar
          </button>
          <div className="view-tabs">
            <button
              className={`tab ${view === 'all' ? 'active' : ''}`}
              onClick={() => setView('all')}
            >
              All
            </button>
            <button
              className={`tab ${view === 'daily' ? 'active' : ''}`}
              onClick={() => setView('daily')}
            >
              Daily
            </button>
            <button
              className={`tab ${view === 'weekly' ? 'active' : ''}`}
              onClick={() => setView('weekly')}
            >
              Weekly
            </button>
            <button
              className={`tab ${view === 'monthly' ? 'active' : ''}`}
              onClick={() => setView('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="duties-content">
        <div className="duties-list-section">
          <h2>Duties List ({duties.length})</h2>
          {duties.length > 0 ? (
            <div className="duties-table">
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {duties.map((duty) => (
                    <tr key={duty._id}>
                      <td>{duty.exam?.examName || duty.exam?.subject}</td>
                      <td>{new Date(duty.date).toLocaleDateString()}</td>
                      <td>{duty.startTime} - {duty.endTime}</td>
                      <td>{duty.room}</td>
                      <td>
                        <span className={`badge badge-${duty.status === 'assigned' ? 'info' : 'success'}`}>
                          {duty.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No duties found</p>
          )}
        </div>

        <div className="calendar-section">
          <h2>Calendar View</h2>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            className="duty-calendar"
          />
          {getDutiesForDate(selectedDate).length > 0 && (
            <div className="selected-date-duties">
              <h3>Duties on {selectedDate.toLocaleDateString()}</h3>
              {getDutiesForDate(selectedDate).map((duty) => (
                <div key={duty._id} className="duty-item">
                  <strong>{duty.exam?.examName || duty.exam?.subject}</strong>
                  <p>{duty.startTime} - {duty.endTime} • {duty.room}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDuties;
