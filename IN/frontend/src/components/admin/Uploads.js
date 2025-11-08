import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './Uploads.css';

const Uploads = () => {
  const [activeTab, setActiveTab] = useState('exams');
  const [files, setFiles] = useState({
    exams: null,
    classrooms: null,
    faculty: null
  });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState({
    exams: { type: '', text: '' },
    classrooms: { type: '', text: '' },
    faculty: { type: '', text: '' }
  });

  // Get current tab's file and message
  const file = files[activeTab];
  const message = messages[activeTab];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name, selectedFile.size);
      setFiles(prev => ({ ...prev, [activeTab]: selectedFile }));
      setMessages(prev => ({ ...prev, [activeTab]: { type: '', text: '' } }));
    }
  };

  const handleClearFile = () => {
    setFiles(prev => ({ ...prev, [activeTab]: null }));
    setMessages(prev => ({ ...prev, [activeTab]: { type: '', text: '' } }));
    // Reset the file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUploadClick = () => {
    // If no file selected, open file picker
    if (!file) {
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.click();
      }
      return;
    }
    // If file is selected, proceed with upload
    handleUpload();
  };

  const handleUpload = async () => {
    setLoading(true);
    setMessages(prev => ({ ...prev, [activeTab]: { type: '', text: '' } }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      if (activeTab === 'exams') {
        endpoint = '/api/upload/exams';
      } else if (activeTab === 'classrooms') {
        endpoint = '/api/upload/classrooms';
      } else if (activeTab === 'faculty') {
        endpoint = '/api/upload/faculty';
      }

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Handle different response formats
      let messageText = response.data.message || 'Upload successful';
      if (activeTab === 'faculty') {
        // Faculty upload returns created, updated, errors
        const created = response.data.created || 0;
        const updated = response.data.updated || 0;
        const errors = response.data.errors || 0;
        const total = created + updated;
        messageText = `${messageText}. ${total} records processed (${created} created, ${updated} updated${errors > 0 ? `, ${errors} errors` : ''}).`;
      } else {
        // Exams and classrooms return count
        const count = response.data.count || 0;
        messageText = `${messageText}. ${count} records processed.`;
      }

      setMessages(prev => ({
        ...prev,
        [activeTab]: { type: 'success', text: messageText }
      }));
      // Keep the file info visible after successful upload
      // Don't clear: setFiles(prev => ({ ...prev, [activeTab]: null }));
      // Don't clear: document.getElementById('file-input').value = '';
    } catch (error) {
      setMessages(prev => ({
        ...prev,
        [activeTab]: { type: 'error', text: error.response?.data?.message || 'Upload failed' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const getFileFormat = () => {
    if (activeTab === 'exams') {
      return {
        headers: ['Exam Name', 'Exam Date', 'Start Time', 'End Time', 'Subject', 'Room', 'Capacity'],
        example: 'Exam Name,Exam Date,Start Time,End Time,Subject,Room,Capacity\nMidterm Exam,2024-01-15,09:00,11:00,Mathematics,Room 101,50'
      };
    } else if (activeTab === 'classrooms') {
      return {
        headers: ['Room Number', 'Building', 'Capacity', 'Floor', 'Facilities'],
        example: 'Room Number,Building,Capacity,Floor,Facilities\nRoom 101,Main Building,50,1,Projector,Whiteboard'
      };
    } else {
      return {
        headers: ['Name', 'Email', 'Employee ID', 'Department', 'Designation', 'Password'],
        example: 'Name,Email,Employee ID,Department,Designation,Password\nJohn Doe,john@example.com,EMP001,Computer Science,Professor,password123'
      };
    }
  };

  const fileFormat = getFileFormat();

  return (
    <div className="uploads-page">
      <h1>File Uploads</h1>
      
      <div className="upload-tabs">
        <button
          className={`tab ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          📚 Exam Timetable
        </button>
        <button
          className={`tab ${activeTab === 'classrooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('classrooms')}
        >
          🏫 Classrooms
        </button>
        <button
          className={`tab ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          👥 Faculty
        </button>
      </div>

      <div className="upload-card">
        <h2>Upload {activeTab === 'exams' ? 'Exam Timetable' : activeTab === 'classrooms' ? 'Classroom Details' : 'Faculty Details'}</h2>
        
        <div className="upload-info">
          <p>Supported formats: CSV, Excel (.xlsx, .xls)</p>
          <p>Required columns: {fileFormat.headers.join(', ')}</p>
        </div>

        <div className="file-upload-area">
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {file && (
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>✅</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#065f46' }}>📄 {file.name}</div>
                  <div style={{ fontSize: '13px', color: '#047857' }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClearFile}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                title="Remove file"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleUploadClick}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Uploading...' : (file ? 'Upload File' : 'Select & Upload File')}
        </button>

        <div className="format-example">
          <h3>Example Format:</h3>
          <pre>{fileFormat.example}</pre>
        </div>
      </div>
    </div>
  );
};

export default Uploads;

