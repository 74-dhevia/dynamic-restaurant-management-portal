import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { verifyToken, getToken } from '../services/jwtService';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, role: userRole } = useAuth();
  const token = getToken();
  const location = useLocation();

  const isAdminRoute = role === 'admin' || location.pathname.startsWith('/admin');
  const isChefRoute = role === 'chef' || location.pathname.startsWith('/chef');

  // Validate session against both Redux state and active JWT token
  const tokenVerification = token ? verifyToken(token) : { valid: false };
  const isAuthed = isAuthenticated && tokenVerification.valid;

  if (!isAuthed) {
    // Single unified login page for all users and roles
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Restrict admin portal: customers & chefs cannot access admin pages
  if (isAdminRoute && userRole !== 'admin') {
    if (userRole === 'chef') {
      return <Navigate to="/chef/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Restrict chef portal: only chefs can access
  if (isChefRoute && userRole !== 'chef') {
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Restrict chef from accessing customer ordering portal
  if (userRole === 'chef' && !isChefRoute) {
    return <Navigate to="/chef/dashboard" replace />;
  }

  // Restrict customer ordering portal: Admin manages the platform and does not place customer food orders
  if (userRole === 'admin' && !isAdminRoute) {
    if (location.pathname === '/profile') {
      return <Navigate to="/admin/profile" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
