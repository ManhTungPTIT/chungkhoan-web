import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Admin from '../feature/auth/admin/index';
import ManagerUser from '../feature/auth/admin/layouts/managerUser';
import KycAdmin from '../feature/auth/admin/layouts/KycAdmin_1';
import TradingView from '../feature/chart/index';
import AdminLogin from '../feature/auth/admin/layouts/login';
import AuthPage from '../feature/auth/user/layouts/AuthPage';
import PrivateRoute from './PrivateRoute';
import AdminPrivateRoute from './AdminPrivateRoute';
import FilterStock from '../feature/stock/layouts/filterStock'
import InfoUser from '../feature/auth/user/layouts/InfoUser';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../feature/homepage/layouts/HomePage'

// Lazy-load: echarts + các trang dùng echarts chỉ tải khi mở route,
// không nằm trong bundle khởi động.
const HeatmapPage = lazy(() => import('../feature/heatmap'));
const PowerPage = lazy(() => import('../feature/power'));

function AppRoute() {
  return (
    <Routes>
      {/* Public routes — NOT gated by PrivateRoute, otherwise the guard would
          redirect to /login while /login itself is gated → infinite loop / blank page. */}
      <Route path="/login" element={<AuthPage initialTab="login" />} />
      <Route path="/register" element={<AuthPage initialTab="register" />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin dashboard — chỉ tài khoản role "admin" mới vào được. */}
      <Route element={<AdminPrivateRoute />}>
        <Route element={<Admin />}>
          <Route path="/admin/user" element={<ManagerUser />} />
          <Route path="/admin/kyc" element={<KycAdmin />} />
        </Route>
      </Route>

      {/* Protected routes — only these sit behind PrivateRoute. */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<TradingView />} />
          <Route path="/home" element = {<HomePage/>}/>
          <Route path="/chart/filter" element={<FilterStock />} />
          <Route path="/info" element={<InfoUser />} />
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
      </Route>
    </Routes>
  );
}

export default AppRoute;
