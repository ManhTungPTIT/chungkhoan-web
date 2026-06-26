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
import { useVn100 } from "../../chart/hooks/useVn100";
import { signalDisplay } from "../../chart/untils/signalDisplay";

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

const PAGE_SIZE = 6;

// Trả về danh sách số trang hiển thị (tối đa `max` số, xoay quanh trang hiện tại)
const getPageNumbers = (current, total, max = 5) => {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(max / 2));
  let end = start + max - 1;
  if (end > total) {
    end = total;
    start = end - max + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const CATEGORIES = [{ name: "Tất cả", code: 1 }];

const convertDay = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

function FilterStock() {
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [codeCate, setCodeCate] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Số dòng/trang tự co theo chiều cao màn (tính ở effect bên dưới)
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const dropdownRef = useRef(null);
  const tableRef = useRef(null);

  const { data: sector = [] } = useSector();
  const { data: symbols = [] } = useSectorSymbol(codeCate);
  const { data: dataPanel = [] } = useVn100();
  console.log(dataPanel)

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

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  // Khi đổi bộ lọc khiến số trang giảm, kéo trang hiện tại về trong khoảng hợp lệ
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Tính số dòng vừa khít chiều cao còn lại: đo từ đỉnh tbody tới đáy viewport,
  // chừa chỗ cho thanh phân trang. Màn to → nhiều dòng, màn nhỏ → ít dòng.
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const recompute = () => {
      const tbody = el.querySelector("tbody");
      if (!tbody) return;
      const firstRow = tbody.querySelector("tr");
      const rowH = firstRow?.getBoundingClientRect().height || 72;
      const top = tbody.getBoundingClientRect().top;
      const RESERVE = 50; // thanh phân trang (20+38) + padding dưới (16)
      const avail = window.innerHeight - top - RESERVE;
      const fit = Math.max(3, Math.floor(avail / rowH));
      setPageSize((prev) => (prev !== fit ? fit : prev));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [rows.length]);

  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
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
                  <td className="col-signal">
                    <span className={`badge badge--${sig.className}`}>
                      {sig.label === "BUY" && Number(s.signal_sessions) > 0
                        ? "Nắm giữ"
                        : sig.label === "SELL" && Number(s.signal_sessions) > 0
                          ? "Ở ngoài"
                          : sig.label}
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
                  <td>T+{s.signal_sessions ?? "--"}</td>
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
