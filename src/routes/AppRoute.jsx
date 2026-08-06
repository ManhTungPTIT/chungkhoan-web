import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Admin from '../feature/auth/admin/index';
import ManagerUser from '../feature/auth/admin/layouts/managerUser';
import KycAdmin from '../feature/auth/admin/layouts/KycAdmin_1';
import TradingView from '../feature/chart/index';
import AdminLogin from '../feature/auth/admin/layouts/login';
import AuthPage from '../feature/auth/user/layouts/AuthPage';
import PrivateRoute from './PrivateRoute';
import GuestRoute from './GuestRoute';
import AdminPrivateRoute from './AdminPrivateRoute';
import FilterStockPage from '../feature/stock/layouts/FilterStockPage'
import InfoUser from '../feature/auth/user/layouts/InfoUser';
import AccountMenu from '../feature/auth/user/layouts/AccountMenu';
import AccountScreen from '../feature/auth/user/layouts/AccountScreen';
import ProfileForm from '../feature/auth/user/components/ProfileForm';
import PasswordForm from '../feature/auth/user/components/PasswordForm';
import PackageForm from '../feature/auth/user/components/PackageForm';
import MainLayout from '../layouts/MainLayout';
import AppLayout from '../layouts/AppLayout';
import HomePage from '../feature/homepage/layouts/HomePage'
import { useLogoutOnAreaSwitch } from './useLogoutOnAreaSwitch';
import { IS_APP } from '../feature/auth/untils/appClient';

// Bản app dùng bottom tab, bản web dùng sidebar. Chọn ở tầng route để MainLayout
// không phải mang thêm nhánh nào — xem layouts/AppLayout.jsx.
const ProtectedLayout = IS_APP ? AppLayout : MainLayout;

// Trang bộ lọc dùng CHUNG một cây thẻ cho hai bản; `variant` chỉ đổi class gốc,
// chỗ chừa dưới bảng và chữ gợi ý. Style thì vẫn tách hẳn hai file SCSS — xem
// VARIANT trong FilterStockPage.jsx.
const FILTER_VARIANT = IS_APP ? 'app' : 'web';

// Lazy-load: echarts + các trang dùng echarts chỉ tải khi mở route,
// không nằm trong bundle khởi động.
const HeatmapPage = lazy(() => import('../feature/heatmap'));
const PowerPage = lazy(() => import('../feature/power'));
const MoneyFlowPage = lazy(() => import('../feature/moneyflow'));
const PutThroughPage = lazy(() => import('../feature/putThrough'));
const TplusWavePage = lazy(() => import('../feature/tplusWave'));
const PotentialFlowPage = lazy(() => import('../feature/potentialFlow'));
const MarketChartsPage = lazy(() => import('../feature/marketCharts'));
const TopGainT2Page = lazy(() => import('../feature/topGainT2'));
const TopGainT3Page = lazy(() => import('../feature/topGainT3'));
const TopGainWeekPage = lazy(() => import('../feature/topGainWeek'));
const FlowSurgePage = lazy(() => import('../feature/flowSurge'));
const IndexOverviewPage = lazy(() => import('../feature/indexOverview'));
const ForeignBuyPage = lazy(() => import('../feature/foreignBuy'));
const ForeignSellPage = lazy(() => import('../feature/foreignSell'));
const TopValuePage = lazy(() => import('../feature/topValue'));
const TopVolumePage = lazy(() => import('../feature/topVolume'));
const TopDeclinePage = lazy(() => import('../feature/topDecline'));
const TopAdvancePage = lazy(() => import('../feature/topAdvance'));
const SectorFlowSurgePage = lazy(() => import('../feature/sectorFlowSurge'));
const SectorFlowConsistencyPage = lazy(() => import('../feature/sectorFlowConsistency'));
const ForeignTradingHistoryPage = lazy(() => import('../feature/foreignTrading'));

function AppRoute() {
  // Đổi vùng admin ↔ user thì tự logout (xem hook).
  useLogoutOnAreaSwitch();

  return (
    <Routes>
      {/* Guest-only routes — người đã đăng nhập gõ /login hoặc /register sẽ bị
          đá về trang chủ. NOT gated by PrivateRoute, otherwise the guard would
          redirect to /login while /login itself is gated → infinite loop / blank page. */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage initialTab="login" />} />
        <Route path="/register" element={<AuthPage initialTab="register" />} />
      </Route>
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
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<TradingView />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/chart/filter" element={<FilterStockPage variant={FILTER_VARIANT} />} />
          {/* Tài khoản: bản app là hub danh sách + ba màn con thật (nút Back cứng của
              Android lùi lịch sử WebView, nên có route con là Back tự về hub); bản web
              vẫn là một trang ba tab. Thân của ba màn dùng chung component, không fork. */}
          {IS_APP ? (
            <>
              <Route path="/info" element={<AccountMenu />} />
              <Route
                path="/info/profile"
                element={
                  <AccountScreen title="Thông tin cá nhân">
                    <ProfileForm />
                  </AccountScreen>
                }
              />
              <Route
                path="/info/password"
                element={
                  <AccountScreen title="Đổi mật khẩu">
                    <PasswordForm />
                  </AccountScreen>
                }
              />
              <Route
                path="/info/package"
                element={
                  <AccountScreen title="Gói đăng ký">
                    <PackageForm />
                  </AccountScreen>
                }
              />
            </>
          ) : (
            <Route path="/info" element={<InfoUser />} />
          )}
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
            path="/chart/money-flow"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải dòng tiền theo ngành…</div>}
              >
                <MoneyFlowPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/put-through"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải giao dịch thỏa thuận…</div>}
              >
                <PutThroughPage />
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
          <Route
            path="/chart/market"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải cặp biểu đồ thị trường…</div>}
              >
                <MarketChartsPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/tplus-wave"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải radar sóng T+…</div>}
              >
                <TplusWavePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/potential-flow"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải biểu đồ mã tiềm năng…</div>}
              >
                <PotentialFlowPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-gain-t2"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Top tăng T+2…</div>}
              >
                <TopGainT2Page />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-gain-t3"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Top tăng T+3…</div>}
              >
                <TopGainT3Page />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-gain-week"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Top tăng tuần…</div>}
              >
                <TopGainWeekPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/flow-surge"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Dòng tiền đột biến…</div>}
              >
                <FlowSurgePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/index-overview"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Chỉ số chung 3 sàn…</div>}
              >
                <IndexOverviewPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/foreign-buy"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Giá trị nước ngoài mua ròng cao nhất…</div>}
              >
                <ForeignBuyPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/foreign-sell"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Giá trị nước ngoài bán ròng cao nhất…</div>}
              >
                <ForeignSellPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-value"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Giá trị tiền khớp lệnh cao nhất…</div>}
              >
                <TopValuePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-volume-view"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Khối lượng khớp lệnh cao nhất…</div>}
              >
                <TopVolumePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/sector-flow-surge"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Ngành có dòng tiền tăng đột biến…</div>}
              >
                <SectorFlowSurgePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-decline"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Top giảm cao nhất…</div>}
              >
                <TopDeclinePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/top-advance"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Top tăng cao nhất…</div>}
              >
                <TopAdvancePage />
              </Suspense>
            }
          />
          <Route
            path="/chart/sector-flow-consistency"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Ngành hút tiền đều đặn nhất…</div>}
              >
                <SectorFlowConsistencyPage />
              </Suspense>
            }
          />
          <Route
            path="/chart/foreign-trading-history"
            element={
              <Suspense
                fallback={<div style={{ padding: "2rem" }}>Đang tải Giá trị mua bán ròng 30 phiên gần nhất…</div>}
              >
                <ForeignTradingHistoryPage />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoute;
