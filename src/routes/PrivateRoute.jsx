import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../feature/auth/admin/untils/tokenStorage';

export default function PrivateRoute() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
