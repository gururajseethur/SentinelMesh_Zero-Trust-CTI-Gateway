import React from 'react';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

function getRoles(userInfo) {
  const realmRoles = userInfo.realm_access?.roles ?? [];
  const clientRoles = userInfo.resource_access?.[KEYCLOAK_CLIENT_ID]?.roles ?? [];
  return [...new Set([...realmRoles, ...clientRoles])];
}

export default function ProtectedRoute({ children, requiredRole }) {
  const { authenticated, loading, userInfo } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <Shield size={28} className="animate-pulse text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface">Authenticating</p>
            <p className="mt-1 text-xs text-on-surface-muted">Connecting to identity provider…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield size={32} className="text-danger" />
          <p className="text-sm font-semibold text-on-surface">Authentication required</p>
          <p className="text-xs text-on-surface-muted">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  if (requiredRole && userInfo) {
    const roles = getRoles(userInfo);
    if (!roles.includes(requiredRole)) {
      toast.warning(`Access restricted — ${requiredRole} role required`, { id: 'rbac-denied' });
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
