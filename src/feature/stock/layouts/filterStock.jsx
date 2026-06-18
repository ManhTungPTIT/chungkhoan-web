import { useMemo, useRef, useState, useEffect } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "../styles/filterStock.scss";
import useSector from "../hooks/useSector";
import useSectorSymbol from "../hooks/useSectorSymbol"
import {useVn100} from "../../chart/hooks/useVn100"

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

const CATEGORIES = [
  {name:"Tất cả", code: 1}
];


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
  const dropdownRef = useRef(null);

  
  const { data: sector = [] } = useSector();
  const {data: symbols = []} = useSectorSymbol(codeCate)
  const { data: dataPanel = [] } = useVn100();
  
  // Danh mục = "Tất cả" + nhóm ngành lấy từ API (tính lại khi sector đổi)
  const categories = useMemo(
    () => [...CATEGORIES, ...sector.map((item) => ({
      name:item.group,
      code:item.icb_code
    }))],
    [sector]
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

  let list;
  const rows = useMemo(() => {
    if(codeCate === 1) list = Array.isArray(dataPanel)? dataPanel : [];
    else list = Array.isArray(symbols[2]) ? symbols[2] : [];
    const keyword = search.trim().toUpperCase();
    if (!keyword) return list;
    return list.filter((s) => s.symbol.includes(keyword));
  }, [search, symbols]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // Khi đổi bộ lọc khiến số trang giảm, kéo trang hiện tại về trong khoảng hợp lệ
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="filter-stock">
      <div className="filter-stock__header">
        <h2 className="filter-stock__title">Bộ lọc cổ phiếu</h2>
        <span className="filter-stock__updated">
          Cập nhật lúc {today}
        </span>
      </div>

      <div className="filter-stock__toolbar">
        <div className="filter-stock__dropdown" ref={dropdownRef}>
          <button
            type="button"
            className={`dropdown-trigger ${openDropdown ? "is-open" : ""}`}
            onClick={() => setOpenDropdown((v) => !v)}
          >
            <span className={category === categories[0].name ? "placeholder" : ""}>
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
                    setCodeCate(item.code)
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

      <div className="filter-stock__table">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tín hiệu</th>
              <th>%Tăng/giảm</th>
              <th>Giá hiện tại</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((s) => (
              <tr key={s.code}>
                <td className="col-code">{s.symbol}</td>
                <td className="col-signal">
                  <span
                    className={`badge ${s.change_pct >= 0 ? "badge--hold" : "badge--sell"}`}
                  >
                    {s.change_pct > 0 ? "GIỮ" : "BÁN"}
                  </span>
                </td>
                <td className="col-date">{s.change_pct}</td>
                <td className="col-price">{s.price/1000}</td>
              </tr>
            ))}
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
