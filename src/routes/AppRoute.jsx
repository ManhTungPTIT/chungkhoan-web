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

function AppRoute() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<TradingView />} />
        <Route path="/chart/filter" element={<FilterStock />} />
      </Route>
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      {/* <Route element={<PrivateRoute />}> */}
        <Route element={<Admin />}>
          <Route path="/admin/user" element={<ManagerUser />} />
          <Route path="/admin/kyc" element={<KycAdmin />} />
        </Route>
      {/* </Route> */}
    </Routes>
  );
}

export default AppRoute;
