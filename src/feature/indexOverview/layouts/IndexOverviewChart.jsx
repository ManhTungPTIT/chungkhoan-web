import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { BsBarChartLineFill } from "react-icons/bs";
import ChartHeader from "../../../components/ChartHeader";
import { useIndexOverview } from "../hooks/useIndexOverview";
import { buildChartOption, BASELINE_PCT } from "../untils/indexOverviewOption";
import "../styles/indexOverview.scss";

const fmt = (v, digits = 2) =>
  v === null || v === undefined
    ? "—"
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(v);

const signClass = (v) => (v === null || v === undefined ? "" : v >= 0 ? "is-up" : "is-down");

// Thanh khoản so với nền: ≥100% là chợ sôi động hơn thường lệ.
const liquidityClass = (v) => (v === null || v === undefined ? "" : v >= BASELINE_PCT ? "is-up" : "is-down");

function IndexChart({ indices }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const chart = echarts.init(ref.current);
    // Truyền bề ngang container để option tự chọn nhánh compact (điện thoại) —
    // và render lại sau resize vì nhánh đó phụ thuộc bề ngang.
    const render = () => chart.setOption(buildChartOption(indices, fmt, ref.current?.clientWidth ?? 0));
    render();

    const onResize = () => {
      chart.resize();
      render();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [indices]);

  return <div ref={ref} className="index-overview__chart" />;
}

function IndexOverviewChart() {
  const { data, isLoading, isError, refetch } = useIndexOverview();
  const indices = data?.indices ?? [];
  const soPhienTb = data?.so_phien_tb ?? 0;
  // React Query GIỮ `data` khi một lượt refetch nền thất bại nhưng vẫn bật
  // isError. Gác chart bằng `!isError` (bản cũ) là mất trắng cả chart lẫn bảng
  // chỉ vì 1 nhịp poll lỗi — hay xảy ra đúng lúc đóng phiên/sáng hôm sau khi
  // vendor chậm. Có dữ liệu thì luôn vẽ, lỗi chỉ hạ thành banner "số liệu cũ".
  const hasData = indices.length > 0;

  return (
    <main className="index-overview">
      <section className="index-overview__card" aria-labelledby="index-overview-title">
        <ChartHeader
          id="index-overview-title"
          icon={<BsBarChartLineFill />}
          title="TOÀN CẢNH CHỈ SỐ"
          variant="blue"
          accent="#5aa9ff"
          className="index-overview__title"
        />

        {isLoading && !hasData && <div className="index-overview__state">Đang tải dữ liệu…</div>}
        {isError && !hasData && (
          <div className="index-overview__state index-overview__state--error">
            Không tải được dữ liệu.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}
        {isError && hasData && (
          <div className="index-overview__stale">
            Không cập nhật được số liệu mới — đang hiển thị bản gần nhất.
            <button type="button" onClick={() => refetch()}>Thử lại</button>
          </div>
        )}

        {hasData && (
          <>
            <IndexChart indices={indices} />
            {soPhienTb === 0 && (
              <div className="index-overview__note">
                Chưa có nền lịch sử để tính thanh khoản — dữ liệu phiên cũ đang được nạp.
              </div>
            )}
            <table className="index-overview__table">
              <thead>
                <tr>
                  <th>Sàn</th>
                  <th>Tổng điểm thị trường</th>
                  <th>
                    Thanh khoản
                    <br />
                    {soPhienTb > 0 ? `(% TB ${soPhienTb} phiên)` : "(% TB)"}
                  </th>
                  <th>Điểm tăng giảm</th>
                  <th>% Tăng giảm</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((r) => (
                  <tr key={r.ten_san}>
                    <td className="index-overview__san">{r.ten_san}</td>
                    <td>{fmt(r.diem_hien_tai)}</td>
                    <td
                      className={liquidityClass(r.thanh_khoan_pct)}
                      // Ghi rõ tách bạch: cột % này so KHỚP LỆNH với nền lịch sử
                      // (nền không có thỏa thuận), còn cột tím của chart là TỔNG.
                      title={
                        `Khớp lệnh: ${fmt(r.gia_tri_khop_lenh)} nghìn tỷ` +
                        (r.gia_tri_thoa_thuan == null
                          ? ""
                          : ` · Thỏa thuận: ${fmt(r.gia_tri_thoa_thuan)} nghìn tỷ` +
                            ` · Tổng: ${fmt(r.gia_tri_giao_dich)} nghìn tỷ`) +
                        `\n% so với TB ${soPhienTb || "N"} phiên tính trên khớp lệnh`
                      }
                    >
                      {r.thanh_khoan_pct == null ? "—" : `${fmt(r.thanh_khoan_pct, 0)}%`}
                    </td>
                    <td className={signClass(r.diem_tang_giam)}>{fmt(r.diem_tang_giam)}</td>
                    <td className={signClass(r.pct)}>{r.pct == null ? "—" : `${fmt(r.pct)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </main>
  );
}

export default IndexOverviewChart;
