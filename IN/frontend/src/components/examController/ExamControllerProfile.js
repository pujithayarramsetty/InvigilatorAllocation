import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../common/Profile.css';

const ExamControllerProfile = () => {
  const { user, updateMe } = useAuth();
  const u = user || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    campus: '',
    department: '',
    designation: ''
  });

  useEffect(() => {
    setForm({
      name: u.name || '',
      employeeId: u.employeeId || '',
      campus: u.campus || '',
      department: u.department || '',
      designation: u.designation || ''
    });
  }, [u.name, u.employeeId, u.campus, u.department, u.designation]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async () => {
    setError('');
    setSaving(true);
    const res = await updateMe(form);
    setSaving(false);
    if (!res.success) {
      setError(res.message || 'Failed to save');
      return;
    }
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      <div className="profile-card">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="profile-row"><span className="label">Name:</span>{editing ? (
          <input name="name" value={form.name} onChange={onChange} />
        ) : (<span>{u.name || '-'}</span>)}</div>
        <div className="profile-row"><span className="label">Email:</span><span>{u.email || '-'}</span></div>
        <div className="profile-row"><span className="label">Role:</span><span>{u.role || '-'}</span></div>
        <div className="profile-row"><span className="label">Employee ID:</span>{editing ? (
          <input name="employeeId" value={form.employeeId} onChange={onChange} />
        ) : (<span>{u.employeeId || '-'}</span>)}</div>
        <div className="profile-row"><span className="label">Block Name:</span>{editing ? (
          <select name="campus" value={form.campus} onChange={onChange}>
            <option value="A Block">A Block</option>
            <option value="H Block">H Block</option>
            <option value="N Block">N Block</option>
            <option value="Library">Library</option>
            <option value="P Block">P Block</option>
            <option value="U Block">U Block</option>
          </select>
        ) : (<span>{u.campus || '-'}</span>)}</div>
        <div className="profile-row"><span className="label">Department:</span>{editing ? (
          <input name="department" value={form.department} onChange={onChange} />
        ) : (<span>{u.department || '-'}</span>)}</div>
        <div className="profile-row"><span className="label">Designation:</span>{editing ? (
          <select name="designation" value={form.designation} onChange={onChange}>
            <option value="Lecturer">Lecturer</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Professor">Professor</option>
            <option value="HOD">HOD</option>
          </select>
        ) : (<span>{u.designation || '-'}</span>)}</div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit</button>
          )}
          {editing && (
            <>
              <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn" onClick={() => { setEditing(false); setError(''); setForm({
                name: u.name || '', employeeId: u.employeeId || '', campus: u.campus || '', department: u.department || '', designation: u.designation || ''
              }); }}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamControllerProfile;
