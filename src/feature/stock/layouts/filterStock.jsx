import { useMemo, useRef, useState, useEffect } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { LuChevronsUpDown } from "react-icons/lu";
import "../styles/filterStock.scss";
import useSector from "../hooks/useSector";
import useSectorSymbol from "../hooks/useSectorSymbol";
import { useAutoPageSize } from "../hooks/useAutoPageSize";
import { useVn100 } from "../../chart/hooks/useVn100";
import { signalDisplay, isHolding } from "../../chart/untils/signalDisplay";
import {
  convertDay,
  getPageNumbers,
  sortRowsBySignal,
} from "../untils/filterStockData";

// `sortRowsBySignal` giữ re-export vì test cũ và các chỗ khác đang import từ đây.
export { sortRowsBySignal };

// Cấu hình cột header
const COLUMNS = [
  { key: "symbol", label: "Mã", sortable: true, align: "left" },
  { key: "signal", label: "Tín hiệu", filter: true },
  { key: "date", label: "Ngày báo", sortable: true },
  { key: "priceReport", label: "Giá báo", sortable: true },
  { key: "price", label: "Giá hiện tại", sortable: true },
  { key: "pnl", label: "Lãi/Lỗ (%)", sortable: true },
  { key: "tplus", label: "T+ (Ngày)" },
];

const CATEGORIES = [{ name: "Tất cả", code: 1 }];

function FilterStock() {
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [codeCate, setCodeCate] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);
  const tableRef = useRef(null);

  const { data: sector = [] } = useSector();
  const { data: symbols = [] } = useSectorSymbol(codeCate);
  const { data: dataPanel = [] } = useVn100();

  // Danh mục = "Tất cả" + nhóm ngành lấy từ API (tính lại khi sector đổi)
  const categories = useMemo(
    () => [
      ...CATEGORIES,
      ...sector.map((item) => ({
        name: item.group,
        code: item.icb_code,
      })),
    ],
    [sector],
  );

  const today = convertDay(new Date());

  // Đóng dropdown khi click ra ngoài
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
      codeCate === 1
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

  // Số dòng/trang tự co theo chiều cao màn. RESERVE 50 = thanh phân trang
  // (20+38) + padding dưới (16).
  const pageSize = useAutoPageSize(tableRef, {
    reserve: 50,
    deps: [sortedRows.length],
  });

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  // Khi đổi bộ lọc khiến số trang giảm, kéo trang hiện tại về trong khoảng hợp lệ
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="filter-stock">
      <div className="filter-stock__header">
        <h2 className="filter-stock__title">Bộ lọc cổ phiếu</h2>
        <span className="filter-stock__updated">Cập nhật lúc {today}</span>
      </div>

      <div className="filter-stock__toolbar">
        <div className="filter-stock__dropdown" ref={dropdownRef}>
          <button
            type="button"
            className={`dropdown-trigger ${openDropdown ? "is-open" : ""}`}
            onClick={() => setOpenDropdown((v) => !v)}
          >
            <span
              className={category === categories[0].name ? "placeholder" : ""}
            >
              {category === categories[0].name ? "Chọn danh mục" : category}
            </span>
            <FiChevronDown className="chevron" />
          </button>

          {openDropdown && (
            <ul className="dropdown-menu">
              {categories.map((item, index) => (
                <li
                  key={index}
                  className={`dropdown-item ${item.name === category ? "is-active" : ""}`}
                  onClick={() => {
                    setCategory(item.name);
                    setOpenDropdown(false);
                    setCodeCate(item.code);
                  }}
                >
                  <span className="dropdown-label">{item.name}</span>
                  <span className="dropdown-radio" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="filter-stock__search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm mã cổ phiếu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-stock__table" ref={tableRef}>
        <table>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  <div
                    className={`th-cell ${col.align === "left" ? "th-cell--left" : ""}`}
                  >
                    <span>{col.label}</span>
                    {col.sortable && <LuChevronsUpDown className="th-sort" />}
                    {col.filter && <FiChevronDown className="th-filter" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((s) => {
              const sig = signalDisplay(s.signal);
              const pct = Number(s.change_pct);
              return (
                <tr key={s.symbol}>
                  <td className="col-code">{s.symbol}</td>
                  {/* KHÔNG hiển thị cờ `signal_stale` của backend: theo yêu cầu
                      sản phẩm, người dùng không cần biết có mã đang chờ vá. Cờ
                      vẫn nằm trong payload để giám sát phía server. */}
                  <td className="col-signal">
                    <span className={`badge badge--${isHolding(s) ? sig.className : "buy"}`}>
                      {isHolding(s) ? "Nắm giữ" : sig.label}
                    </span>
                  </td>
                  {/* Backend VN100 chưa trả ngày báo/giá báo/T+ → tạm "--" */}
                  <td>{s.signal_date ? convertDay(s.signal_date) : "--"}</td>
                  <td>{s.signal_price != null ? s.signal_price : "--"}</td>
                  <td className="col-price">{(s.price / 1000).toFixed(2)}</td>
                  <td
                    className={`col-pnl ${pct >= 0 ? "col-pnl--up" : "col-pnl--down"}`}
                  >
                    {Number.isFinite(pct) ? `${pct}%` : "--"}
                  </td>
                  <td>
                    T+{(s.signal_sessions)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="filter-stock__pagination">
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

export default FilterStock;
