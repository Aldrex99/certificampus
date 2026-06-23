import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types';

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  }
  return <Outlet />;
}
