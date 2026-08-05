import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiInfo,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiEyeOff,
} from "react-icons/fi";
import { LuChevronsUpDown } from "react-icons/lu";
import "../styles/filterStockApp.scss";
import useSector from "../hooks/useSector";
import useSectorSymbol from "../hooks/useSectorSymbol";
import { useAutoPageSize } from "../hooks/useAutoPageSize";
import { useVn100 } from "../../chart/hooks/useVn100";
import {
  PHASE,
  PHASE_BADGE,
  convertDay,
  convertTime,
  countPhases,
  getPageNumbers,
  pnlPct,
  sessionPhase,
  sortRowsBySignal,
  todayIso,
  PRICE_BOARD_SCALE,
} from "../untils/filterStockData";

// Bản DỌC cho app native. Bản web giữ nguyên ở filterStock.jsx — chọn giữa hai
// bản ở tầng route bằng cờ IS_APP, giống cách AppLayout/MainLayout đang làm.
// Tách hẳn hai bản để đổi giao diện app không có đường nào làm hỏng web.

// `width` khoá tường minh vì `table-layout: fixed` chia đều thì cột "TRẠNG THÁI
// PHIÊN" hẹp tới mức "Đang nắm giữ" vỡ thành ba dòng, đội chiều cao mỗi dòng lên
// gấp đôi và chỉ còn 3 mã lọt một trang.
const COLUMNS = [
  { key: "symbol", label: ["MÃ"], width: "11%", sortable: true, align: "left" },
  // Badge nay mang cả "Đứng ngoài" (11 ký tự) nên cột này rộng nhất trong nhóm
  // trái. Cột kế bên đổi tiêu đề thành "SỐ PHIÊN": tên pha đã chuyển hẳn vào
  // badge, để nguyên "TRẠNG THÁI PHIÊN" thì tiêu đề rộng hơn nội dung nó chứa
  // và tràn sang cột bên.
  { key: "signal", label: ["TÍN HIỆU"], width: "21%" },
  { key: "date", label: ["NGÀY BÁO", "MUA / BÁN"], width: "17%", sortable: true },
  { key: "phase", label: ["SỐ PHIÊN"], width: "15%", sortable: true },
  { key: "pnl", label: ["% LÃI / LỖ", "HIỆN TẠI"], width: "17%", sortable: true },
  { key: "price", label: ["GIÁ HIỆN TẠI", "GIÁ BÁO"], width: "19%", sortable: true },
];

// Bốn thẻ thống kê — bốn pha LOẠI TRỪ NHAU, xem untils/filterStockData.js.
const TILES = [
  { phase: PHASE.BUY, label: "Tín hiệu BUY", tone: "buy", Icon: FiTrendingUp },
  { phase: PHASE.SELL, label: "Tín hiệu SELL", tone: "sell", Icon: FiTrendingDown },
  { phase: PHASE.HOLD, label: "Đang nắm giữ", tone: "hold", Icon: FiPieChart },
  { phase: PHASE.OUT, label: "Đứng ngoài", tone: "out", Icon: FiEyeOff },
];

const ALL_CATEGORY = { name: "Tất cả danh mục", code: 1 };

function FilterStockApp() {
  const [category, setCategory] = useState(ALL_CATEGORY.name);
  const [codeCate, setCodeCate] = useState(ALL_CATEGORY.code);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();

  const { data: sector = [] } = useSector();
  const { data: symbols = [] } = useSectorSymbol(codeCate);
  const { data: dataPanel = [], dataUpdatedAt, refetch, isFetching } = useVn100();

  const categories = useMemo(
    () => [ALL_CATEGORY, ...sector.map((item) => ({ name: item.group, code: item.icb_code }))],
    [sector],
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rows = useMemo(() => {
    const list =
      codeCate === ALL_CATEGORY.code
        ? Array.isArray(dataPanel)
          ? dataPanel
          : []
        : Array.isArray(symbols[2])
          ? symbols[2]
          : [];
    const keyword = search.trim().toUpperCase();
    if (!keyword) return list;
    return list.filter((s) => s.symbol?.includes(keyword));
  }, [search, symbols, dataPanel, codeCate]);

  const sortedRows = useMemo(() => sortRowsBySignal(rows), [rows]);

  // Mốc "hôm nay" tính MỘT lần cho cả trang: thẻ thống kê và cột trạng thái phải
  // dùng chung mốc, nếu không thì đúng lúc qua nửa đêm hai chỗ nói khác nhau.
  const today = useMemo(() => todayIso(), []);
  const counts = useMemo(() => countPhases(sortedRows, today), [sortedRows, today]);

  // RESERVE lớn hơn bản web vì dưới bảng còn dòng gợi ý "chạm để xem chi tiết"
  // và thanh tab dưới cùng của app.
  const pageSize = useAutoPageSize(tableRef, {
    reserve: 132,
    deps: [sortedRows.length],
  });

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = getPageNumbers(page, totalPages);

  const updatedLabel = dataUpdatedAt
    ? `${convertDay(dataUpdatedAt)} ${convertTime(dataUpdatedAt)}`
    : "--";

  return (
    <div className="filter-app">
      <div className="filter-app__header">
        <div>
          <h2 className="filter-app__title">Bộ lọc cổ phiếu</h2>
          {/* Giờ ở đây là lúc TẢI dữ liệu (dataUpdatedAt của react-query), không
              phải giờ phát tín hiệu — tín hiệu sinh từ nến NGÀY nên không mang
              giờ nào cả. */}
          <p className="filter-app__updated">
            Cập nhật lúc <span>{updatedLabel}</span>
          </p>
        </div>
        <button
          type="button"
          className={`filter-app__refresh ${isFetching ? "is-loading" : ""}`}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <FiRefreshCw />
          <span>Cập nhật</span>
        </button>
      </div>

      <div className="filter-app__toolbar">
        <div className="filter-app__dropdown" ref={dropdownRef}>
          <button
            type="button"
            className={`dropdown-trigger ${openDropdown ? "is-open" : ""}`}
            onClick={() => setOpenDropdown((v) => !v)}
          >
            <span className="dropdown-text">
              <small>Chọn danh mục</small>
              <strong>{category}</strong>
            </span>
            <FiChevronDown className="chevron" />
          </button>

          {openDropdown && (
            <ul className="dropdown-menu">
              {categories.map((item) => (
                <li
                  key={item.code}
                  className={`dropdown-item ${item.name === category ? "is-active" : ""}`}
                  onClick={() => {
                    setCategory(item.name);
                    setCodeCate(item.code);
                    setOpenDropdown(false);
                    setPage(1);
                  }}
                >
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="filter-app__search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm mã cổ phiếu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="filter-app__tiles">
        {TILES.map(({ phase, label, tone, Icon }) => (
          <div key={phase} className={`tile tile--${tone}`}>
            <div className="tile__text">
              <span className="tile__label">{label}</span>
              <strong className="tile__value">{counts[phase]}</strong>
            </div>
            <Icon className="tile__icon" />
          </div>
        ))}
      </div>

      <div className="filter-app__table" ref={tableRef}>
        <table>
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  <div className={`th-cell ${col.align === "left" ? "th-cell--left" : ""}`}>
                    <span className="th-label">
                      {col.label.map((line) => (
                        <em key={line}>{line}</em>
                      ))}
                    </span>
                    {col.sortable && <LuChevronsUpDown className="th-sort" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((s) => {
              const phase = sessionPhase(s, today);
              const pnl = pnlPct(s);
              return (
                <tr
                  key={s.symbol}
                  onClick={() => navigate(`/?symbol=${encodeURIComponent(s.symbol)}`)}
                >
                  <td className="col-code">{s.symbol}</td>
                  {/* KHÔNG hiển thị cờ `signal_stale` của backend: theo yêu cầu
                      sản phẩm, người dùng không cần biết có mã đang chờ vá. */}
                  {/* Badge mang PHA (MUA / BÁN / Nắm giữ / Đứng ngoài) chứ không
                      mang loại lệnh: mã đã qua ngày báo mà vẫn ghi BUY thì người
                      dùng tưởng đang có tín hiệu mua mới. */}
                  <td className="col-signal">
                    <span className={`badge badge--${phase ?? "none"}`}>
                      {phase ? PHASE_BADGE[phase] : "--"}
                    </span>
                  </td>
                  <td className="col-date">
                    {s.signal_date ? convertDay(s.signal_date) : "--"}
                  </td>
                  <td className="col-phase">
                    {s.signal_sessions != null ? `${s.signal_sessions} phiên` : "--"}
                  </td>
                  <td
                    className={`col-pnl ${pnl == null ? "" : pnl >= 0 ? "col-pnl--up" : "col-pnl--down"}`}
                  >
                    {pnl == null ? "--" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
                  </td>
                  <td className="col-price">
                    <strong>{(Number(s.price) / PRICE_BOARD_SCALE).toFixed(2)}</strong>
                    <small>{s.signal_price != null ? Number(s.signal_price).toFixed(2) : "--"}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="filter-app__hint">
        <FiInfo />
        Chạm vào dòng để xem chi tiết
      </p>

      {totalPages > 1 && (
        <div className="filter-app__pagination">
          <button
            type="button"
            className="page-btn page-btn--arrow"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <FiChevronLeft />
          </button>

          {pageNumbers.map((n) => (
            <button
              type="button"
              key={n}
              className={`page-btn ${n === page ? "is-active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            className="page-btn page-btn--arrow"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterStockApp;
