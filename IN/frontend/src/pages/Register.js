import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'faculty',
    employeeId: '',
    campus: 'A Block',
    department: '',
    designation: 'Lecturer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Department is required for Exam Controller
    if (formData.role === 'examController' && !formData.department) {
      setError('Department is required for Exam Controller registration');
      return;
    }

    setLoading(true);

    // Prepare registration data
    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      employeeId: formData.employeeId || undefined,
      campus: formData.campus,
      department: formData.department || undefined,
      designation: formData.designation
    };

    const result = await register(registrationData);
    
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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>📅 Schedulo</h1>
          <p>Create Your Account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="input-group">
            <label>I am registering as:</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'admin' })}
              >
                👨‍💼 Admin
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'examController' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'examController' })}
              >
                🎓 Exam Controller
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'faculty' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'faculty' })}
              >
                👨‍🏫 Faculty
              </button>
            </div>
            {formData.role === 'admin' && (
              <p className="role-note">ℹ️ Admin accounts have full system access. Employee ID is recommended.</p>
            )}
            {formData.role === 'examController' && (
              <p className="role-note">ℹ️ Exam Controller manages exams for a specific department. Department is required.</p>
            )}
          </div>

          <div className="input-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="input-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          {formData.role === 'admin' && (
            <div className="input-group">
              <label>Employee ID (Recommended)</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter employee ID (optional)"
              />
            </div>
          )}

          {formData.role === 'examController' && (
            <>
              <div className="input-group">
                <label>Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="Enter department name (e.g., Computer Science)"
                />
              </div>

              <div className="input-group">
                <label>Employee ID (Optional)</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                />
              </div>

              <div className="input-group">
                <label>Block Name</label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                >
                  <option value="A Block">A Block</option>
                  <option value="H Block">H Block</option>
                  <option value="N Block">N Block</option>
                  <option value="Library">Library</option>
                  <option value="P Block">P Block</option>
                  <option value="U Block">U Block</option>
                </select>
              </div>
            </>
          )}

          {formData.role === 'faculty' && (
            <>
              <div className="input-group">
                <label>Employee ID (Optional)</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                />
              </div>

              <div className="input-group">
                <label>Block Name</label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                >
                  <option value="A Block">A Block</option>
                  <option value="H Block">H Block</option>
                  <option value="N Block">N Block</option>
                  <option value="Library">Library</option>
                  <option value="P Block">P Block</option>
                  <option value="U Block">U Block</option>
                </select>
              </div>

              <div className="input-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              </div>

              <div className="input-group">
                <label>Designation</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                >
                  <option value="Lecturer">Lecturer</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="HOD">HOD</option>
                </select>
              </div>
            </>
          )}

          <div className="input-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Confirm your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          
          <div className="register-links">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </form>
        
        <div className="register-footer">
          <p>Invigilator Allocation System</p>
        </div>
      </div>
    </div>
  );
};

export default Register;

