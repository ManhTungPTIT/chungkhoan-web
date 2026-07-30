/** Hợp đồng hiển thị của chart "TOÀN CẢNH CHỈ SỐ".
 *
 * Lý do có file này: bản cũ gác chart bằng `!isError`, mà React Query GIỮ `data`
 * khi một lượt refetch NỀN thất bại và vẫn bật isError → chỉ 1 nhịp poll lỗi là
 * mất trắng cả chart lẫn bảng, dù dữ liệu tốt vẫn còn trong cache. Hiện tượng
 * người dùng gặp: "chart mất khi đóng phiên hoặc sang hôm sau".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockQuery = vi.fn();
vi.mock("../../hooks/useIndexOverview", () => ({
  useIndexOverview: () => mockQuery(),
}));
// echarts cần canvas thật — chart vẽ gì đã có indexOverviewOption.test.js lo.
vi.mock("echarts", () => ({
  init: () => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }),
}));

import IndexOverviewChart from "../IndexOverviewChart";

const DATA = {
  generated_at: "2026-07-30T14:50:00+07:00",
  so_phien_tb: 14,
  indices: [
    { ten_san: "VN INDEX", diem_hien_tai: 1704.68, gia_tri_khop_lenh: 15.18, thanh_khoan_pct: 105.15, diem_tang_giam: 24.06, pct: 1.43 },
    { ten_san: "VN30", diem_hien_tai: 1849.12, gia_tri_khop_lenh: 8.89, thanh_khoan_pct: 101.92, diem_tang_giam: 24.77, pct: 1.36 },
  ],
};

const state = (over) => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn(), ...over });

beforeEach(() => mockQuery.mockReset());

describe("IndexOverviewChart", () => {
  it("poll lỗi nhưng còn dữ liệu → VẪN vẽ chart + bảng, chỉ thêm banner số liệu cũ", () => {
    mockQuery.mockReturnValue(state({ data: DATA, isError: true }));
    const { container } = render(<IndexOverviewChart />);

    expect(container.querySelector(".index-overview__chart")).toBeTruthy();
    expect(screen.getByText("VN INDEX")).toBeTruthy();
    expect(screen.getByText(/đang hiển thị bản gần nhất/i)).toBeTruthy();
    expect(screen.queryByText(/Không tải được dữ liệu/i)).toBeNull();
  });

  it("refetch nền đang chạy (isLoading) mà đã có dữ liệu → không nháy sang trạng thái tải", () => {
    mockQuery.mockReturnValue(state({ data: DATA, isLoading: true }));
    render(<IndexOverviewChart />);

    expect(screen.queryByText(/Đang tải dữ liệu/i)).toBeNull();
    expect(screen.getByText("VN INDEX")).toBeTruthy();
  });

  it("lỗi ngay từ lần tải đầu (chưa có gì) → báo lỗi kèm nút thử lại", () => {
    mockQuery.mockReturnValue(state({ isError: true }));
    const { container } = render(<IndexOverviewChart />);

    expect(screen.getByText(/Không tải được dữ liệu/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeTruthy();
    expect(container.querySelector(".index-overview__chart")).toBeNull();
  });

  it("bảng giữ cột % TB N phiên (chart đổi sang nghìn tỷ, bảng thì không)", () => {
    mockQuery.mockReturnValue(state({ data: DATA }));
    render(<IndexOverviewChart />);

    // Nhãn cột bị <br/> cắt thành nhiều text node → so trên textContent của th.
    const headers = screen.getAllByRole("columnheader").map((el) => el.textContent);
    expect(headers.some((t) => t.includes("(% TB 14 phiên)"))).toBe(true);
    expect(screen.getByText("105%")).toBeTruthy();
  });
});
