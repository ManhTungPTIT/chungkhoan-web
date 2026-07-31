import { useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { BsCalendar3 } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useSectorFlowConsistency } from "../hooks/useSectorFlowConsistency";
import { buildConsistencyView, CELL_BANDS } from "../untils/consistencyView";
import "../styles/sectorFlowConsistency.scss";

const TOP_MODES = { "Top 15 ngành": 15, "Tất cả ngành": 0 };
const SESSION_MODES = { "30 phiên": 30, "60 phiên": 60 };

const fmt = (value, digits = 2) => value.toFixed(digits);
const signed = (value, digits = 1) => `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;

// Nhãn ngày chỉ in thưa: 30 nhãn "dd/MM" chen trong 30 cột vài chục px thì
// chồng lên nhau thành vệt đen. Mốc đầu/cuối luôn hiện để đọc được khoảng thời gian.
function tickVisible(index, total) {
  if (index === 0 || index === total - 1) return true;
  const step = total > 40 ? 10 : 5;
  return index % step === 0;
}

function SectorFlowConsistencyChart() {
  const [topMode, setTopMode] = useState("Top 15 ngành");
  const [sessionMode, setSessionMode] = useState("30 phiên");
  const sessions = SESSION_MODES[sessionMode] ?? 30;

  const { data, isLoading, isError, refetch } = useSectorFlowConsistency(sessions);
  const view = useMemo(
    () => buildConsistencyView(data, TOP_MODES[topMode] ?? 15),
    [data, topMode],
  );
  const { rows, dates, dateLabels } = view;

  return (
    // `--rows` = số ngành đang vẽ; scss chia chiều cao còn lại cho nó để lưới
    // luôn gói trong một màn hình (xem --fc-row-h). Đặt ở ĐÂY, không đặt trên
    // .flow-consistency__grid: --fc-row-h khai báo ở root nên không "thấy" được
    // biến định nghĩa ở phần tử con.
    <main className="flow-consistency" style={{ "--rows": Math.max(rows.length, 1) }}>
      <section className="flow-consistency__card" aria-labelledby="flow-consistency-title">
        <ChartHeader
          id="flow-consistency-title"
          icon={<BsCalendar3 />}
          title="DÒNG TIỀN THEO NGÀNH"
          variant="navy"
          accent="#35c66b"
          control={
            <div className="flow-consistency__controls">
              <div className="flow-consistency__select">
                <select
                  aria-label="Số phiên nhìn lại"
                  value={sessionMode}
                  onChange={(event) => setSessionMode(event.target.value)}
                >
                  {Object.keys(SESSION_MODES).map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
                <FiChevronDown aria-hidden="true" />
              </div>
              <div className="flow-consistency__select">
                <select
                  aria-label="Số ngành hiển thị"
                  value={topMode}
                  onChange={(event) => setTopMode(event.target.value)}
                >
                  {Object.keys(TOP_MODES).map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
                <FiChevronDown aria-hidden="true" />
              </div>
            </div>
          }
        />

        <div className="flow-consistency__legend" aria-label="Chú giải mức điểm">
          {CELL_BANDS.map((band) => (
            <span className="flow-consistency__legend-item" key={band.id}>
              <i className={`flow-consistency__swatch flow-consistency__swatch--${band.id}`} />
              {band.label}
            </span>
          ))}
        </div>

        {isLoading && <div className="flow-consistency__state">Đang tải dữ liệu…</div>}
        {isError && (
          <div className="flow-consistency__state flow-consistency__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="flow-consistency__state">Chưa có dữ liệu.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="flow-consistency__grid-wrap">
            <div
              className="flow-consistency__grid"
              style={{ "--cols": dates.length }}
              role="table"
              aria-label="Lưới điểm dòng tiền theo ngành và phiên"
            >
              <div className="flow-consistency__row flow-consistency__row--head" role="row">
                <span className="flow-consistency__rank" role="columnheader">#</span>
                <span className="flow-consistency__name" role="columnheader">Ngành</span>
                <span className="flow-consistency__score-head" role="columnheader">
                  Điểm dòng tiền MA{view.sessions}
                </span>
                <span className="flow-consistency__metric" role="columnheader">
                  So {view.maLookback} phiên
                </span>
                <span className="flow-consistency__ticks" aria-hidden="true">
                  {dateLabels.map((label, index) => (
                    <em key={dates[index]}>{tickVisible(index, dates.length) ? label : ""}</em>
                  ))}
                </span>
                <span className="flow-consistency__metric" role="columnheader">TB/ĐLC</span>
                <span className="flow-consistency__metric" role="columnheader">Phiên +</span>
              </div>

              {rows.map((row, index) => (
                <div
                  className={`flow-consistency__row${
                    index === view.dividerAfter ? " flow-consistency__row--divider" : ""
                  }`}
                  role="row"
                  key={row.icbCode || row.group}
                >
                  <span className="flow-consistency__rank" role="cell">{row.rank}</span>
                  <span className="flow-consistency__name" role="rowheader" title={`${row.group} · ${row.symbolCount} mã`}>
                    {row.group}
                  </span>
                  <span className="flow-consistency__score" role="cell">
                    <em className={`flow-consistency__score-value flow-consistency__score-value--${row.mean >= 0 ? "up" : "down"}`}>
                      {signed(row.mean)}
                    </em>
                    <span className="flow-consistency__score-track">
                      <i
                        className={`flow-consistency__score-bar flow-consistency__score-bar--${row.mean >= 0 ? "up" : "down"}`}
                        style={{ width: `${row.maBarPct}%` }}
                      />
                    </span>
                  </span>
                  {row.delta === null ? (
                    <span className="flow-consistency__metric" role="cell" title="Chưa đủ lịch sử để so sánh">—</span>
                  ) : (
                    <span
                      className={`flow-consistency__metric flow-consistency__metric--${row.delta >= 0 ? "up" : "down"}`}
                      role="cell"
                      title={`Điểm MA${view.sessions} thay đổi ${signed(row.delta)} điểm so với ${view.maLookback} phiên trước`}
                    >
                      {row.delta >= 0 ? "▲" : "▼"} {signed(row.delta)}
                    </span>
                  )}
                  <span className="flow-consistency__cells">
                    {row.cells.map((cell) => (
                      <i
                        className={`flow-consistency__cell flow-consistency__cell--${cell.band}`}
                        key={cell.date}
                        role="cell"
                        title={
                          cell.score === null
                            ? `${cell.date}: không có dữ liệu`
                            : `${cell.date}: ${cell.score > 0 ? "+" : ""}${cell.score}`
                        }
                      />
                    ))}
                  </span>
                  <strong
                    className={`flow-consistency__metric flow-consistency__metric--${row.ratio >= 0 ? "up" : "down"}`}
                    role="cell"
                  >
                    {fmt(row.ratio)}
                  </strong>
                  <span className="flow-consistency__metric" role="cell">
                    {row.positiveSessions}/{view.sessions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* <footer className="flow-consistency__footer">
          <small>
            {rows.length > 0 && `Hiện ${rows.length}/${view.total} ngành · `}
            Điểm mã mỗi phiên: +100 giá tăng &amp; thanh khoản ≥ 1.5× nền 20 phiên · +50 giá tăng ·
            0 đứng giá · −50 giá giảm · −100 giá giảm &amp; thanh khoản ≥ 1.5× nền
            {view.generatedAt ? ` · Cập nhật: ${view.generatedAt}` : ""}
          </small>
        </footer> */}
      </section>
    </main>
  );
}

export default SectorFlowConsistencyChart;
