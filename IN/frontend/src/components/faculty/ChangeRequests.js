import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './ChangeRequests.css';

const ChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [myDuties, setMyDuties] = useState([]);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    requestedReplacement: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRequests();
    fetchMyDuties();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/faculty/change-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDuties = async () => {
    try {
      const response = await api.get('/api/faculty/duties');
      setMyDuties(response.data);
    } catch (error) {
      console.error('Error fetching duties:', error);
    }
  };

  const handleOpenModal = async (allocation) => {
    setSelectedAllocation(allocation);
    try {
      const response = await api.get(
        `/api/faculty/available-faculty?date=${allocation.date}&startTime=${allocation.startTime}&endTime=${allocation.endTime}`
      );
      setAvailableFaculty(response.data);
    } catch (error) {
      console.error('Error fetching available faculty:', error);
    }
    setShowModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/faculty/change-request', {
        allocationId: selectedAllocation._id,
        reason: formData.reason,
        requestedReplacementId: formData.requestedReplacement || null
      });
      setMessage({ type: 'success', text: 'Change request submitted successfully' });
      setShowModal(false);
      setFormData({ reason: '', requestedReplacement: '' });
      await fetchRequests();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return <div className="spinner" />;
  }

  return (
    <div className="change-requests-page">
      <h1>Change Requests</h1>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="requests-section">
        <h2>My Requests</h2>
        {requests.length > 0 ? (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-info">
                  <h3>Request for {request.allocation?.exam?.examName || 'Duty'}</h3>
                  <p><strong>Date:</strong> {new Date(request.allocation?.date).toLocaleDateString()}</p>
                  <p><strong>Reason:</strong> {request.reason}</p>
                  {request.requestedReplacement && (
                    <p><strong>Requested Replacement:</strong> {request.requestedReplacement.name}</p>
                  )}
                  <p><strong>Status:</strong> 
                    <span className={`badge badge-${request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}`}>
                      {request.status}
                    </span>
                  </p>
                  {request.adminResponse && (
                    <p><strong>Admin Response:</strong> {request.adminResponse}</p>
                  )}
                </div>
                <div className="request-date">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No change requests submitted yet</p>
        )}
      </div>

      <div className="my-duties-section">
        <h2>My Duties - Request Change</h2>
        <p>Select a duty to request a change or replacement</p>
        {myDuties.length > 0 ? (
          <div className="duties-grid">
            {myDuties.filter(duty => new Date(duty.date) >= new Date()).map((duty) => (
              <div key={duty._id} className="duty-card-request">
                <div className="duty-card-content">
                  <h3>{duty.exam?.examName || duty.exam?.subject}</h3>
                  <p>📅 {new Date(duty.date).toLocaleDateString()}</p>
                  <p>⏰ {duty.startTime} - {duty.endTime}</p>
                  <p>🏫 {duty.room}</p>
                </div>
                <button
                  onClick={() => handleOpenModal(duty)}
                  className="btn btn-primary btn-sm"
                >
                  Request Change
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No upcoming duties to request changes for</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request Change</h2>
            <form onSubmit={handleSubmitRequest}>
              <div className="input-group">
                <label>Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows="4"
                  placeholder="Explain why you need a change..."
                />
              </div>
              <div className="input-group">
                <label>Request Replacement (Optional)</label>
                <select
                  value={formData.requestedReplacement}
                  onChange={(e) => setFormData({ ...formData, requestedReplacement: e.target.value })}
                >
                  <option value="">None</option>
                  {availableFaculty.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.name} - {faculty.department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeRequests;

