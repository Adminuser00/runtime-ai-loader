import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ 
  fallback = <DefaultFallback />, 
  unauthenticatedElement = <Navigate to="/login" replace /> 
}) {
  const auth = useAuth() || {};
  const { 
    isAuthenticated = false, 
    isLoadingAuth = false, 
    authChecked = true, 
    authError = null, 
    checkUserAuth 
  } = auth;

  useEffect(() => {
    if (!authChecked && !isLoadingAuth && typeof checkUserAuth === 'function') {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
