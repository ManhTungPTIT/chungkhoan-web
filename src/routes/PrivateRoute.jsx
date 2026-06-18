import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../feature/auth/admin/untils/tokenStorage';
import axiosAdmin from '../feature/auth/admin/untils/axiosAdmin';

// Xác thực phiên bằng cách gọi endpoint protected /api/auth/me:
//   - access token còn hạn        → 200 → cho vào
//   - access hết hạn, refresh OK   → interceptor tự refresh + retry → 200 → cho vào
//   - refresh cũng hết hạn         → interceptor clearTokens + redirect /admin/login;
//                                    ở đây cũng trả về unauthed làm phương án dự phòng
export default function PrivateRoute() {
  // 'checking' | 'authed' | 'unauthed'
  const [status, setStatus] = useState(() =>
    getAccessToken() ? 'checking' : 'unauthed',
  );

  useEffect(() => {
    if (status !== 'checking') return;
    let active = true;

    axiosAdmin
      .get('/api/auth/me')
      .then(() => active && setStatus('authed'))
      .catch(() => active && setStatus('unauthed'));

    return () => {
      active = false;
    };
  }, [status]);

  if (status === 'checking') {
    return <div style={{ padding: '2rem' }}>Đang kiểm tra phiên đăng nhập…</div>;
  }
  return status === 'authed' ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
