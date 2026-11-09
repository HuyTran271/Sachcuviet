import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';

export default function PrivateRoute() {
  return getCurrentUser() ? <Outlet />: <Navigate to="/login" replace />;
}