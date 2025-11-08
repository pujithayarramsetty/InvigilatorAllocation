import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message);
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
      if (response.data.token) {
        setResetToken(response.data.token);
      }
      setEmail('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      console.error('Forgot password error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>🔐 Forgot Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>
        
        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          
          {resetLink && (
            <div className="reset-link-container">
              <h3>📱 Reset Link (Click to Copy)</h3>
              <div className="reset-link-box">
                <input 
                  type="text" 
                  value={resetLink} 
                  readOnly 
                  className="reset-link-input"
                  onClick={(e) => {
                    e.target.select();
                    navigator.clipboard.writeText(resetLink);
                    alert('Link copied to clipboard!');
                  }}
                />
                <button 
                  type="button"
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink);
                    alert('Link copied to clipboard!');
                  }}
                >
                  📋 Copy
                </button>
              </div>
              <p className="reset-instructions">
                <strong>For Mobile:</strong> Make sure your phone is on the same Wi-Fi network. Replace "localhost" with your computer's IP address (e.g., 192.168.0.102) in the link above.
              </p>
              {resetToken && (
                <div className="reset-token-box">
                  <p><strong>Or use this token manually:</strong></p>
                  <input 
                    type="text" 
                    value={resetToken} 
                    readOnly 
                    className="reset-token-input"
                    onClick={(e) => {
                      e.target.select();
                      navigator.clipboard.writeText(resetToken);
                    }}
                  />
                  <p className="token-instructions">
                    Go to: <strong>/reset-password/{resetToken}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <div className="forgot-password-links">
            <p>Remember your password? <Link to="/login">Back to Login</Link></p>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

