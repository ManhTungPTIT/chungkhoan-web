// Test phần chọn gói trong UserModal (admin đặt gói tay cho user).
// Regression: onClick thẻ gói từng dùng toán tử phẩy → handler là undefined
// (click không làm gì) + setState chạy ngay lúc render; nút Lưu gọi
// onSetPackage với title kẹt "5 năm".
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserModal } from "../managerUser";

const user = {
  id: "u1",
  fullName: "Nguyen Van A",
  email: "a@example.com",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastActive: "2026-07-01T00:00:00.000Z",
  expiresAt: null,
};

function renderModal(onSetPackage) {
  return render(
    <UserModal
      user={user}
      busy={false}
      onClose={vi.fn()}
      onLock={vi.fn()}
      onUnlock={vi.fn()}
      onDelete={vi.fn()}
      onSetPackage={onSetPackage}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserModal package picker", () => {
  it("chọn gói rồi Lưu → onSetPackage(titles, days) đúng gói đã chọn", () => {
    const onSetPackage = vi.fn();
    renderModal(onSetPackage);

    fireEvent.click(screen.getByText("180")); // thẻ gói 180 ngày
    fireEvent.click(screen.getByRole("button", { name: /lưu gói/i }));

    expect(onSetPackage).toHaveBeenCalledWith("180 ngày", 180);
  });

  it("gói theo năm ghép title từ label + unit", () => {
    const onSetPackage = vi.fn();
    const { container } = renderModal(onSetPackage);

    // Thẻ "1 năm": pkg-num "1", pkg-unit "năm" — click qua pkg-num.
    const card = [...container.querySelectorAll(".pkg-card")].find(
      (el) => el.querySelector(".pkg-num")?.textContent === "1",
    );
    fireEvent.click(card);
    fireEvent.click(screen.getByRole("button", { name: /lưu gói/i }));

    expect(onSetPackage).toHaveBeenCalledWith("1 năm", 365);
  });

  it("mặc định là gói 90 ngày", () => {
    const onSetPackage = vi.fn();
    renderModal(onSetPackage);

    fireEvent.click(screen.getByRole("button", { name: /lưu gói/i }));

    expect(onSetPackage).toHaveBeenCalledWith("90 ngày", 90);
  });
});
