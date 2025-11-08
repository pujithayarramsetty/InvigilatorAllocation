import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    let route = '/faculty';
    if (user.role === 'admin') route = '/admin';
    else if (user.role === 'examController') route = '/exam-controller';
    return <Navigate to={route} replace />;
  }

  return children;
};

export default PrivateRoute;

