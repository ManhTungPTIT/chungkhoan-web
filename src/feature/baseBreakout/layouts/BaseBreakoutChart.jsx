import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsCalendar3, BsClock } from "react-icons/bs";
import { useBaseBreakout } from "../hooks/useBaseBreakout";
import { useBaseBreakoutLayout } from "../hooks/useBaseBreakoutLayout";
import {
  assignBubbles,
  fmtBreakout,
  fmtRatio,
  formatBadge,
  tileValues,
} from "../untils/baseBreakoutData";
import desktopBg from "../../../assets/base-breakout-bg.jpg";
import mobileBg from "../../../assets/base-breakout-bg-mobile.png";
import "../styles/baseBreakout.scss";

const BACKGROUNDS = { desktop: desktopBg, mobile: mobileBg };

// Tiêu đề, nhãn thẻ, thang band và các quả bong bóng đều nằm SẴN trong ảnh nền —
// component này chỉ phủ chữ lên đúng chỗ. Vì vậy không có <ChartHeader>: thêm
// vào là có hai tiêu đề chồng nhau.
export default function BaseBreakoutChart() {
  const { data, isLoading, isError, refetch } = useBaseBreakout();
  const layout = useBaseBreakoutLayout();
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();

  const bubbles = useMemo(
    () => assignBubbles(data?.rows, layout.bubbles),
    [data?.rows, layout.bubbles],
  );
  const tiles = useMemo(() => tileValues(data?.summary), [data?.summary]);
  const badge = useMemo(
    () => formatBadge(data?.generated_at, now),
    [data?.generated_at, now],
  );

  // Đồng hồ giây trong badge. Bản mobile không có ô badge nên khỏi chạy timer.
  useEffect(() => {
    if (!layout.badge) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [layout.badge]);

  return (
    <section
      className={`base-breakout base-breakout--${layout.id}`}
      aria-label="Top mã vượt nền tích lũy 30 phiên"
    >
      <div
        className="base-breakout__canvas"
        style={{
          backgroundImage: `url(${BACKGROUNDS[layout.image]})`,
          aspectRatio: `${layout.width} / ${layout.height}`,
          // Cỡ chữ khai ở layout rồi truyền xuống SCSS qua biến: cùng một cỡ chữ
          // THẬT ứng với số cqw rất khác nhau giữa khung ngang và khung dọc.
          "--bb-tile-value": layout.fonts.tileValue,
          "--bb-tile-unit": layout.fonts.tileUnit,
          "--bb-badge": layout.fonts.badge,
          "--bb-badge-gap": layout.fonts.badgeGap,
        }}
      >
        {layout.tiles.map((tile) => (
          <div
            key={tile.key}
            className="base-breakout__tile"
            style={{ left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%` }}
          >
            <span className="base-breakout__tile-value">{tiles[tile.key]}</span>
            {tile.unit && <span className="base-breakout__tile-unit">{tile.unit}</span>}
          </div>
        ))}

        {/* Bốn con TRỰC TIẾP của một grid 2 cột (icon | chữ), không bọc mỗi dòng
            trong span: bọc lại thì hai dòng thành hai grid riêng và chữ ngày/giờ
            không còn thẳng cột khi bề rộng icon lệch nhau.

            Nền nào đã vẽ sẵn icon lịch/đồng hồ (`badge.icons === false`) thì chỉ
            còn cột chữ — xem baseBreakoutSlots.js. */}
        {layout.badge && (
          <div
            className={`base-breakout__badge${
              layout.badge.icons ? "" : " base-breakout__badge--bare"
            }`}
            style={{
              left: `${layout.badge.x}%`,
              top: `${layout.badge.y}%`,
              width: `${layout.badge.w}%`,
            }}
          >
            {layout.badge.icons && <BsCalendar3 aria-hidden="true" />}
            <span>{badge.day}</span>
            {layout.badge.icons && <BsClock aria-hidden="true" />}
            <span>{badge.time}</span>
          </div>
        )}

        {bubbles.map((bubble) =>
          bubble.row ? (
            <button
              type="button"
              key={bubble.index}
              className="base-breakout__bubble"
              // Cỡ chữ theo BỀ RỘNG QUẢ BÓNG (đơn vị cqw của chính canvas): quả
              // nhỏ nhất chỉ rộng 1/3 quả to nhất, dùng một cỡ chung là chữ tràn
              // ra ngoài quả nhỏ. Sàn tối thiểu khai theo từng layout — xem
              // `fonts.minBubble` trong baseBreakoutSlots.js.
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.w}%`,
                fontSize: `max(${layout.fonts.minBubble}, ${bubble.w * 0.19}cqw)`,
              }}
              onClick={() => navigate(`/?symbol=${encodeURIComponent(bubble.row.symbol)}`)}
              title={`${bubble.row.symbol} · giá ${bubble.row.gia_hien_tai} · nền ${bubble.row.bien_do_nen}% · tăng từ đáy ${bubble.row.tang_tu_day}% · GTGD ${bubble.row.gia_tri_khop_lenh} tỷ`}
            >
              <strong>{bubble.row.symbol}</strong>
              <span>{fmtBreakout(bubble.row.vuot_nen)}</span>
              <span>{fmtRatio(bubble.row.tl_thanh_khoan)}</span>
            </button>
          ) : null,
        )}

        {(isLoading || isError) && (
          <div className="base-breakout__state">
            {isLoading ? (
              "Đang tải dữ liệu…"
            ) : (
              <>
                Không tải được dữ liệu.
                <button type="button" onClick={() => refetch()}>Thử lại</button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
