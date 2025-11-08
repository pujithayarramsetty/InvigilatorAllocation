import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './ChangeRequests.css';

const ChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/api/exam-controller/change-requests${params}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setResponse('');
    setShowModal(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    try {
      await api.put(`/api/exam-controller/change-requests/${selectedRequest._id}`, {
        status: actionType,
        adminResponse: response
      });
      alert(`Request ${actionType} successfully!`);
      setShowModal(false);
      setResponse('');
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update request');
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <div className="change-requests">
      <div className="page-header">
        <h2>Change Requests</h2>
        <div className="filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="requests-list">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.allocation?.exam?.examName || request.allocation?.exam?.subject}</h3>
                  <p>
                    <strong>Requested by:</strong> {request.requester?.name} ({request.requester?.email})
                  </p>
                  <p>
                    <strong>Exam Date:</strong> {new Date(request.allocation?.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {request.allocation?.startTime} - {request.allocation?.endTime}
                  </p>
                  <p>
                    <strong>Room:</strong> {request.allocation?.room}
                  </p>
                  <p>
                    <strong>Block:</strong> {request.allocation?.campus || request.allocation?.exam?.campus}
                  </p>
                </div>
                <span className={`status-badge ${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="request-details">
                <div className="detail-item">
                  <strong>Current Invigilator:</strong>
                  <span>{request.requester?.name}</span>
                </div>
                {request.requestedReplacement && (
                  <div className="detail-item">
                    <strong>Requested Replacement:</strong>
                    <span>{request.requestedReplacement?.name} ({request.requestedReplacement?.email})</span>
                  </div>
                )}
                {request.reason && (
                  <div className="detail-item">
                    <strong>Reason:</strong>
                    <span>{request.reason}</span>
                  </div>
                )}
                {request.adminResponse && (
                  <div className="detail-item">
                    <strong>Response:</strong>
                    <span>{request.adminResponse}</span>
                  </div>
                )}
                <div className="detail-item">
                  <strong>Submitted:</strong>
                  <span>{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    onClick={() => handleOpenModal(request, 'approved')}
                    className="btn btn-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenModal(request, 'rejected')}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No change requests found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{actionType === 'approved' ? 'Approve' : 'Reject'} Change Request</h2>
            <p>
              <strong>Faculty:</strong> {selectedRequest?.requester?.name}<br />
              <strong>Exam:</strong> {selectedRequest?.allocation?.exam?.examName || selectedRequest?.allocation?.exam?.subject}<br />
              <strong>Date:</strong> {new Date(selectedRequest?.allocation?.date).toLocaleDateString()}
            </p>
            <div className="input-group">
              <label>Response (Optional)</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows="4"
                placeholder={`Provide feedback to the faculty member...`}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleApproveReject} 
                className={`btn ${actionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
              >
                Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeRequests;

