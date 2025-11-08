import React, { useState } from 'react';
import api from '../../utils/axios';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports/pdf/all', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invigilation-schedule.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'PDF report downloaded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download PDF report' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports/excel/all', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invigilation-schedule.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'Excel report downloaded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download Excel report' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyAll = async () => {
    if (!window.confirm('Send email notifications to all faculty members?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/reports/notify-all');
      setMessage({
        type: 'success',
        text: `Notifications sent! ${response.data.sent} emails sent, ${response.data.failed} failed.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send notifications' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <h1>Reports & Notifications</h1>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">📄</div>
          <h2>PDF Report</h2>
          <p>Download complete invigilation schedule as PDF</p>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary"
            disabled={loading}
          >
            Download PDF
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon">📊</div>
          <h2>Excel Report</h2>
          <p>Download complete invigilation schedule as Excel</p>
          <button
            onClick={handleDownloadExcel}
            className="btn btn-primary"
            disabled={loading}
          >
            Download Excel
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon">📧</div>
          <h2>Email Notifications</h2>
          <p>Send email notifications to all faculty members</p>
          <button
            onClick={handleNotifyAll}
            className="btn btn-success"
            disabled={loading}
          >
            Send Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;

