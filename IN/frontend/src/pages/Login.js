import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('faculty'); // Default to faculty
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, role);
    
    if (result.success) {
      // Wait a bit for user state to update
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = result.user?.role || user.role;
        let route = '/faculty';
        if (userRole === 'admin') route = '/admin';
        else if (userRole === 'examController') route = '/exam-controller';
        navigate(route);
      }, 100);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>📅 Schedulo</h1>
          <p>Smart Campus Automation & Scheduling</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="input-group">
            <label>I am logging in as:</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                👨‍💼 Admin
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'examController' ? 'active' : ''}`}
                onClick={() => setRole('examController')}
              >
                🎓 Exam Controller
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
                onClick={() => setRole('faculty')}
              >
                👨‍🏫 Faculty
              </button>
            </div>
          </div>
          
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="login-links">
            <p><Link to="/forgot-password">Forgot Password?</Link></p>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </form>
        
        <div className="login-footer">
          <p>Invigilator Allocation System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

