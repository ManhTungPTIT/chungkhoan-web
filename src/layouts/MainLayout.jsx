import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MdStackedLineChart } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { TiHomeOutline } from "react-icons/ti";
import { LuArrowUpNarrowWide } from "react-icons/lu";
import { BsFunnel } from "react-icons/bs";
import { MdGridView } from "react-icons/md";
import { MdExpandMore } from "react-icons/md";
import { FaRegStar } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";
import { FaArrowUp } from "react-icons/fa";
import { MdPhoneForwarded } from "react-icons/md";
import { FaQuestion } from "react-icons/fa6";
import { PiSlidersHorizontal } from "react-icons/pi";
import { IoBookOutline } from "react-icons/io5";
import { FiDollarSign } from "react-icons/fi";
import { IoLogOutOutline } from "react-icons/io5";
import { LoginUserService } from "../feature/auth/user/services/loginUserService";
import { useMe } from "../feature/auth/user/hooks/useMe";
import { activePackageTitle } from "../feature/auth/user/untils/packageDisplay";
import { GiLion } from "react-icons/gi";
import "../feature/chart/index.scss";
import logo from "../assets/logo-auth.png"

function MainLayout() {
  const navigate = useNavigate();
  const { logout } = LoginUserService();
  // Mobile: sidebar thu gọn sẵn để nội dung chiếm trọn màn; desktop mở sẵn
  const [showSidebar, setShowSidebar] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768,
  );
  // Dropdown gộp "Bản đồ nhiệt", "Bản đồ sức mạnh dòng tiền", "Toàn cảnh thị trường"
  const [mapMenuOpen, setMapMenuOpen] = useState(false);

  const data = JSON.parse(localStorage.getItem("auth-storage"));
  // Hồ sơ lấy từ API (/user/me) — nguồn chuẩn; localStorage chỉ là fallback hiển
  // thị tức thời. Login có thể không lưu user nên không dựa hẳn vào localStorage.
  const { data: me } = useMe();
  
  const fullName =
    me?.fullName || data?.state?.user?.fullName || "Quản trị viên";
  const role = me?.role || data?.state?.user?.role;
  // Gói đang dùng: packageRequest đã duyệt trong /user/me; fallback packageTitle
  // lưu lúc login khi API chưa về (xem packageDisplay.js).
  const packageTitle = activePackageTitle(me, data?.state?.user);
  // Đăng xuất: thu hồi refresh token ở BE + xoá token cục bộ rồi về /login.
  // Best-effort — service tự xoá token & chuyển trang kể cả khi API lỗi.
  const handleLogout = () => {
    navigate('/login')
    logout();
  };

  return (
    <div className="main">
      <button
        className={`showSidebar${showSidebar ? " visible" : ""}`}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        <FaArrowRight />
      </button>
      <div className={`mainSidebar${showSidebar ? " hidden" : ""}`}>
        <div className="ms-header">
          <div style={{display: "flex", marginTop: "0.3rem"}}>
            <img className="logo" src={logo} alt="ảnh logo"/>
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)}>
            <GiHamburgerMenu />
          </button>
        </div>
        <div className="ms-auth">
          <a>
            <div
              className="ms-auth-avatar"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/info")}
            >
              <FaUserCircle style={{ width: "1.5rem", height: "1.5rem" }} />
            <span>{fullName}</span>
            
            </div>
            <button onClick={handleLogout}>
              <IoLogOutOutline />
            </button>
          </a>
          {packageTitle && <span>VIP {packageTitle}</span>}
        </div>
        <div className="ms-body">
          <ul className="ms-body-navbar">
            <li className="navbar-item text-redirect" onClick={() => navigate("/?bot=trend")}>
              <a>
                <TiHomeOutline />
                <span>Trang chủ</span>
              </a>
            </li>
            <li className="navbar-item">
              <span>Chứng khoán cơ sở</span>
            </li>
            <li className="navbar-item text-redirect" onClick={() => navigate("/?bot=trend")}>
              <a>
                <LuArrowUpNarrowWide />
                <span>BOT Trend</span>
              </a>
            </li>
            <li className="navbar-item text-redirect" onClick={() => navigate("/?bot=t")}>
              <a>
                <LuArrowUpNarrowWide />
                <span>BOT T+</span>
              </a>
            </li>
            <li className="navbar-item text-redirect" onClick={() => navigate("/?bot=long")}>
              <a>
                <LuArrowUpNarrowWide />
                <span>BOT Dài hạn</span>
              </a>
            </li>
            <li
              className="navbar-item text-redirect"
              onClick={() => navigate("/chart/filter")}
            >
              <a>
                <BsFunnel />
                <span>Bộ lọc cổ phiếu</span>
              </a>
            </li>
            <li
              className={`navbar-item text-redirect power-parent${
                mapMenuOpen ? " is-open" : ""
              }`}
              onClick={() => setMapMenuOpen((v) => !v)}
            >
              <a className="break-word">
                <MdGridView />
                <span>Bản đồ thị trường</span>
                <MdExpandMore className="navbar-caret" />
              </a>
            </li>
            <li className={`navbar-submenu${mapMenuOpen ? " is-open" : ""}`}>
              <ul>
                <li
                  className="navbar-subitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/chart/heatmap");
                  }}
                >
                  <a>
                    <span>Bản đồ nhiệt</span>
                  </a>
                </li>
                <li
                  className="navbar-subitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/chart/power");
                  }}
                >
                  <a>
                    <span>Bản đồ sức mạnh dòng tiền</span>
                  </a>
                </li>
                <li
                  className="navbar-subitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/home");
                  }}
                >
                  <a>
                    <span>Bản đồ toàn cảnh thị trường</span>
                  </a>
                </li>
              </ul>
            </li>
            {/* <li className="navbar-item">
              <span>Thông tin</span>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <FaQuestion />
                <span>Giới thiệu</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <FiDollarSign />
                <span>Bảng giá</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <MdPhoneForwarded />
                <span>Liên hệ</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <IoBookOutline />
                <span>Hướng dẫn</span>
              </a>
            </li> */}
          </ul>
        </div>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
