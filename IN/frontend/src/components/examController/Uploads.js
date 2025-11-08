import React, { useState } from 'react';
import api from '../../utils/axios';
import './Uploads.css';

const Uploads = () => {
  const [uploading, setUploading] = useState({
    exams: false,
    faculty: false,
    classrooms: false
  });
  const [messages, setMessages] = useState({
    exams: null,
    faculty: null,
    classrooms: null
  });

  const handleFileUpload = async (type, file) => {
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log(`Uploading ${type}:`, file.name, 'Size:', file.size);

    const formData = new FormData();
    formData.append('file', file);

    setUploading(prev => ({ ...prev, [type]: true }));
    setMessages(prev => ({ ...prev, [type]: null }));

    try {
      console.log(`Sending request to /api/exam-controller/upload/${type}`);
      const response = await api.post(`/api/exam-controller/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      setMessages(prev => ({
        ...prev,
        [type]: {
          type: 'success',
          text: response.data.message,
          details: response.data
        }
      }));
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      setMessages(prev => ({
        ...prev,
        [type]: {
          type: 'error',
          text: error.response?.data?.message || error.message || 'Upload failed. Please check the file format and try again.'
        }
      }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const UploadCard = ({ title, type, icon, description, accept }) => (
    <div className="upload-card">
      <div className="upload-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      
      <div className="upload-area">
        <input
          type="file"
          id={`file-${type}`}
          accept={accept}
          onChange={(e) => handleFileUpload(type, e.target.files[0])}
          disabled={uploading[type]}
          className="file-input"
        />
        <label htmlFor={`file-${type}`} className="file-label">
          {uploading[type] ? (
            <>
              <span className="spinner-small"></span>
              Uploading...
            </>
          ) : (
            <>
              📁 Choose File
            </>
          )}
        </label>
      </div>

      {messages[type] && (
        <div className={`message message-${messages[type].type}`}>
          <p>{messages[type].text}</p>
          {messages[type].details && (
            <div className="upload-details">
              {messages[type].details.created > 0 && (
                <span className="detail-badge success">✓ {messages[type].details.created} Created</span>
              )}
              {messages[type].details.updated > 0 && (
                <span className="detail-badge info">↻ {messages[type].details.updated} Updated</span>
              )}
              {messages[type].details.errors && messages[type].details.errors.length > 0 && (
                <span className="detail-badge error">⚠ {messages[type].details.errors.length} Errors</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="uploads-page">
      <h1>Upload Data Files</h1>
      <p className="page-description">
        Upload CSV or Excel files to add exam timetables, faculty data, and classroom information for your department.
      </p>

      <div className="uploads-grid">
        <UploadCard
          title="Exam Timetable"
          type="exams"
          icon="📅"
          description="Upload exam schedule with dates, times, rooms, and subjects for your department"
          accept=".csv,.xlsx,.xls"
        />
        
        <UploadCard
          title="Faculty Data"
          type="faculty"
          icon="👥"
          description="Upload faculty member details including names, emails, and designations"
          accept=".csv,.xlsx,.xls"
        />
        
        <UploadCard
          title="Classroom Details"
          type="classrooms"
          icon="🏫"
          description="Upload classroom information with room numbers, capacity, and facilities"
          accept=".csv,.xlsx,.xls"
        />
      </div>

      <div className="upload-info">
        <h2>📋 Upload Guidelines</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Supported Formats</h3>
            <ul>
              <li>CSV (.csv)</li>
              <li>Excel (.xlsx, .xls)</li>
            </ul>
          </div>
          <div className="info-card">
            <h3>File Requirements</h3>
            <ul>
              <li>Maximum file size: 10MB</li>
              <li>First row must contain column headers</li>
              <li>Use standard column names (case-insensitive)</li>
            </ul>
          </div>
          <div className="info-card">
            <h3>Need Help?</h3>
            <ul>
              <li>Check the Excel Upload Guide for templates</li>
              <li>Ensure all required fields are filled</li>
              <li>Use correct date and time formats</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uploads;
