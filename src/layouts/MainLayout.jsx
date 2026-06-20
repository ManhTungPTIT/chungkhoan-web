import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MdStackedLineChart } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { TiHomeOutline } from "react-icons/ti";
import { LuArrowUpNarrowWide } from "react-icons/lu";
import { BsFunnel } from "react-icons/bs";
import { MdGridView } from "react-icons/md";
import { BsBullseye } from "react-icons/bs";
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
import "../feature/chart/index.scss";

function MainLayout() {
  const navigate = useNavigate();
  const { logout } = LoginUserService();
  // Mobile: sidebar thu gọn sẵn để nội dung chiếm trọn màn; desktop mở sẵn
  const [showSidebar, setShowSidebar] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768,
  );

  const data = JSON.parse(localStorage.getItem("auth-storage"));
  console.log(data.state.user.fullName)
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
          <div >
            <MdStackedLineChart /> Leostock
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
            <span>{data.state.user.fullName}</span>
            </div>
            <button onClick={handleLogout}>
              <IoLogOutOutline />
            </button>
          </a>
        </div>
        <div className="ms-body">
          <ul className="ms-body-navbar">
            <li className="navbar-item text-redirect" onClick={() => navigate("/")}>
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
              className="navbar-item text-redirect"
              onClick={() => navigate("/chart/heatmap")}
            >
              <a>
                <MdGridView />
                <span>Bản đồ nhiệt</span>
              </a>
            </li>
            <li
              className="navbar-item text-redirect"
              onClick={() => navigate("/chart/power")}
            >
              <a>
                <BsBullseye />
                <span>Vòng tròn quyền lực</span>
              </a>
            </li>
            <li className="navbar-item">
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
            </li>
          </ul>
        </div>
        <div className="ms-footer">
          <b>Nền tảng số cho Môi giới chứng khoán</b>
        </div>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
