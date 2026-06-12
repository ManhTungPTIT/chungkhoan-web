import "./index.scss";
import { useState, useEffect, useRef } from "react";
import { MdStackedLineChart } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { TiHomeOutline } from "react-icons/ti";
import { LuArrowUpNarrowWide } from "react-icons/lu";
import { BsFunnel } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";
import { FaArrowUp } from "react-icons/fa";
import { MdPhoneForwarded } from "react-icons/md";
import { FaQ, FaQuestion } from "react-icons/fa6";
import { PiSlidersHorizontal } from "react-icons/pi";
import { IoBookOutline } from "react-icons/io5";
import { FiDollarSign } from "react-icons/fi";
import { IoLogOutOutline } from "react-icons/io5";
import TradingChart from "../chart/layouts/chart";
import { generateSignals } from "./untils/indicators";
import Panel from "../chart/layouts/panel";
import { useIntraday } from "./hooks/useIntraday";
import { useVn100 } from "./hooks/useVn100";
import axios from "axios";

const COLOR_CODE_BUY = { action: "Xanh", color: "blue" };
const COLOR_CODE_SELL = { action: "Đỏ", color: "red" };

// Nhận Date hoặc chuỗi ngày ("2026-02-23 07:00"); giá trị không parse được
// (vd "--" khi chưa có signal) trả về nguyên văn thay vì crash render
const convertDay = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

function TradingView() {
  const [openPanel, setOpenPanel] = useState(false);
  const [chanelCode, setChaneCode] = useState("VNINDEX");
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: candles = [] } = useIntraday(chanelCode);
  const { data: dataPanel = [] } = useVn100();

  const signals = generateSignals(candles);
  const infoRef = useRef(null);
  const [infoHeight, setInfoHeight] = useState(0);

  console.log("candles", candles);
  useEffect(() => {
    if (!infoRef.current) return;
    const ro = new ResizeObserver(() => {
      setInfoHeight(infoRef.current.offsetHeight);
    });
    ro.observe(infoRef.current);
    return () => ro.disconnect();
  }, []);

  const today = new Date();

  // const day = String(today.getDate()).padStart(2, "0");
  // const month = String(today.getMonth() + 1).padStart(2, "0");
  // const year = today.getFullYear();

  const dayCurrent = convertDay(today);

  //Lay gia va ngay tai diem signal cuoi cung (co the chua co khi data dang tai)
  const lastSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const priceChange = lastSignal ? lastSignal.price : "--";
  const dayChange = lastSignal ? lastSignal.date : "--";
  const dayChangeConvert = convertDay(dayChange);
  const COLORCODE =
    lastSignal && lastSignal.type === "buy" ? COLOR_CODE_BUY : COLOR_CODE_SELL;

  const priceCurrent =
    candles.length > 0 ? candles[candles.length - 1].close : "--";

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
          <div>
            <MdStackedLineChart /> Future R
          </div>
          <button onClick={() => setShowSidebar(!showSidebar)}>
            <GiHamburgerMenu />
          </button>
        </div>
        <div className="ms-auth">
          <a>
            <div className="ms-auth-avatar">
              <FaUserCircle style={{ width: "1.5rem", height: "1.5rem" }} />
            </div>
            <span>0133456798</span>
            <button>
              <IoLogOutOutline />
            </button>
          </a>
        </div>
        <div className="ms-body">
          <ul className="ms-body-navbar">
            <li className="navbar-item text-redirect">
              <a>
                <TiHomeOutline />
                <span>Trang chủ</span>
              </a>
            </li>
            <li className="navbar-item">
              <span>Chứng khoán cơ sở</span>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <LuArrowUpNarrowWide />
                <span>Future R Đánh T+</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <FaArrowUp />
                <span>Future R Đánh Trend</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <BsFunnel />
                <span>Bộ lọc cổ phiếu</span>
              </a>
            </li>
            <li className="navbar-item">
              <span>Chứng khoán phái sinh</span>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <PiSlidersHorizontal />
                <span>Future R 1 Min</span>
              </a>
            </li>
            <li className="navbar-item text-redirect">
              <a>
                <FaRegStar />
                <span>Future R Trend 1M</span>
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
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          height: "100vh",
          overflow: "hidden",
          flex: 1,
          minWidth: 0,
          marginLeft: "0.1rem",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            borderInline: "1px solid var(--border)",
          }}
        >
          <div
            ref={infoRef}
            className="information"
            style={{
              fontFamily: "sans-serif",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              alignItems: "end",
              margin: "0",
            }}
          >
            <h1 style={{ color: "purple", margin: "0.4rem" }}>{chanelCode}</h1>
            <div style={{ display: "flex", fontSize: "0.6rem" }}>
              Quy tắc giao dịch:<p style={{ color: "green" }}>Xanh vào</p>-
              <p style={{ color: "red" }}> Đỏ ra</p>
            </div>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.5rem" }}>
              <p style={{ color: COLORCODE.color }}>
                Giá chuyển {COLORCODE.action}: {priceChange}
              </p>
              <p style={{ color: COLORCODE.color }}>
                Ngày chuyển {COLORCODE.action}: {dayChangeConvert}
              </p>
            </div>

            <div
              style={{
                color: "#B36AAA",
                fontSize: "0.5rem",
                display: "flex",
                gap: "1rem",
              }}
            >
              <p>Giá hiện tại: {priceCurrent}</p>
              <p>Ngày HIỆN TẠI: {dayCurrent}</p>
            </div>

            {/* <div style={{ display: "flex", gap: "2rem", fontSize: "0.6rem" }}>
              <p style={{ color: "red" }}>Giá chốt lãi/Cắt lỗ: 198.3</p>
              <p>Mục tiêu dự kiến: 168 | 196 | 252</p>
            </div> */}
            {/* <h2
              style={{
                color: "purple ",
                marginBottom: "0",
                fontSize: "0.8rem",
              }}
            >
              Giá hiện tại 228.1
            </h2>
            <p style={{ color: "green ", fontSize: "0.6rem" }}>
              Khuyến nghị: Vùng xanh, tiếp tục nắm giữ
            </p> */}
          </div>
          <TradingChart
            candles={candles}
            signals={signals}
            infoHeight={infoHeight}
          />
        </div>
        <Panel
          dataPanel={dataPanel}
          onSelectSymbol={(symbol) => setChaneCode(symbol)}
        />
      </div>
    </div>
  );
}

export default TradingView;
