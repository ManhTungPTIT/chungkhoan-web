import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataStatusBanner from "../DataStatusBanner";

// Poll 5s fail (backend chết/mất mạng) trước đây im lặng: chart giữ nến cũ
// (keepPreviousData) và trông như "đứng hình" không rõ lý do. Banner này là
// tín hiệu duy nhất cho người dùng biết dữ liệu đang KHÔNG cập nhật.
describe("DataStatusBanner", () => {
  it("không render gì khi poll bình thường", () => {
    const { container } = render(
      <DataStatusBanner isError={false} hasData={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("báo 'dữ liệu cũ' khi poll lỗi nhưng còn nến cũ trên chart", () => {
    render(<DataStatusBanner isError={true} hasData={true} />);
    expect(screen.getByRole("alert").textContent).toMatch(
      /Mất kết nối máy chủ dữ liệu/,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/dữ liệu cũ/);
  });

  it("báo không kết nối được khi poll lỗi và chưa có nến nào", () => {
    render(<DataStatusBanner isError={true} hasData={false} />);
    expect(screen.getByRole("alert").textContent).toMatch(
      /Không kết nối được máy chủ dữ liệu/,
    );
  });
});
