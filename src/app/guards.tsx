import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { User } from '../../types';

type RequireAuthProps = {
  user: User | null;
  children: ReactNode;
};

type RequireRoleProps = RequireAuthProps & {
  role: string;
};

export const RequireAuth = ({ user, children }: RequireAuthProps) => {
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export const RequireRole = ({ user, role, children }: RequireRoleProps) => {
  if (String(user?.role || '').toUpperCase() !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

