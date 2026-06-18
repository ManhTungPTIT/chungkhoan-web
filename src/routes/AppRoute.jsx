import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Admin from '../feature/auth/admin/index';
import ManagerUser from '../feature/auth/admin/layouts/managerUser';
import KycAdmin from '../feature/auth/admin/layouts/KycAdmin_1';
import TradingView from '../feature/chart/index';
import AdminLogin from '../feature/auth/admin/layouts/login';
import UserLogin from '../feature/auth/user/layouts/login';
import UserRegister from '../feature/auth/user/layouts/register';
import PrivateRoute from './PrivateRoute';
import FilterStock from '../feature/stock/layouts/filterStock'
import MainLayout from '../layouts/MainLayout';

// Lazy-load: echarts + các trang dùng echarts chỉ tải khi mở route,
// không nằm trong bundle khởi động.
const HeatmapPage = lazy(() => import('../feature/heatmap'));
const PowerPage = lazy(() => import('../feature/power'));

function AppRoute() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<TradingView />} />
        <Route path="/chart/filter" element={<FilterStock />} />
        <Route
          path="/chart/heatmap"
          element={
            <Suspense
              fallback={<div style={{ padding: "2rem" }}>Đang tải bản đồ nhiệt…</div>}
            >
              <HeatmapPage />
            </Suspense>
          }
        />
        <Route
          path="/chart/power"
          element={
            <Suspense
              fallback={<div style={{ padding: "2rem" }}>Đang tải vòng tròn quyền lực…</div>}
            >
              <PowerPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<PrivateRoute requiredRole="admin" />}>
        <Route element={<Admin />}>
          <Route path="/admin/user" element={<ManagerUser />} />
          <Route path="/admin/kyc" element={<KycAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoute;
