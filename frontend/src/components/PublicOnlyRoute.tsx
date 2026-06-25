import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';

/**
 * Wraps auth pages (login, etc.). If a session is already active, redirect to
 * the user's dashboard instead of showing the form.
 */
export function PublicOnlyRoute() {
  const user = useAppSelector((s) => s.auth.user);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  }
  return <Outlet />;
}
