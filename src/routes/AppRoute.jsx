import { Routes, Route } from "react-router-dom";
import Admin from "../feature/auth/admin/index";
import ManagerUser from "../feature/auth/admin/layouts/managerUser";
import KycAdmin from "../feature/auth/admin/layouts/KycAdmin_1";
import TradingView from "../feature/chart/index";

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<TradingView />} />
      <Route path="/admin" element={<Admin />}>
        <Route index element={<Admin />} />
        <Route path="user" element={<ManagerUser />} />
        <Route path="kyc" element={<KycAdmin />} />
      </Route>
    </Routes>
  );
}

export default AppRoute;
