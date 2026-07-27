import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MainLayout from "../MainLayout";

// Hồ sơ /user/me thay đổi theo từng test.
let meData;

vi.mock("../../feature/auth/user/hooks/useMe", () => ({
  useMe: () => ({ data: meData }),
}));

vi.mock("../../feature/auth/user/services/loginUserService", () => ({
  LoginUserService: () => ({ logout: vi.fn() }),
}));

beforeEach(() => {
  meData = {
    fullName: "Nguyen Van A",
    role: "user",
    packageRequest: null,
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>TRANG CHỦ</div>} />
          <Route path="/info" element={<div>TRANG THÔNG TIN</div>} />
          <Route path="/chart/market" element={<div>BIỂU ĐỒ GHÉP</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("MainLayout — điều hướng phần thông tin người dùng", () => {
  it("bấm vào avatar/tên người dùng thì sang trang /info", () => {
    renderLayout();

    expect(screen.getByText("TRANG CHỦ")).toBeTruthy();

    fireEvent.click(screen.getByText("Nguyen Van A"));

    expect(screen.getByText("TRANG THÔNG TIN")).toBeTruthy();
  });
  it("không crash khi auth-storage trong localStorage bị hỏng", () => {
    localStorage.setItem("auth-storage", "{bad-json");

    renderLayout();

    expect(screen.getByText("Nguyen Van A")).toBeTruthy();
    expect(screen.getByText(/TRANG/)).toBeTruthy();
  });
});

describe("MainLayout — mở cặp biểu đồ đầu tiên", () => {
  it("điều hướng đến cặp biểu đồ đầu tiên khi bấm tab biểu đồ thị trường", () => {
    renderLayout();

    fireEvent.click(screen.getByText("Biểu đồ thị trường"));

    expect(screen.getByText("BIỂU ĐỒ GHÉP")).toBeTruthy();
  });
});
describe("MainLayout — sidebar chỉ còn một mục biểu đồ", () => {
  it("KHÔNG còn liệt kê tên từng biểu đồ trong sidebar", () => {
    renderLayout();

    fireEvent.click(screen.getByText("Biểu đồ thị trường"));

    // Danh sách tên biểu đồ đã chuyển sang nút nổi trên trang /chart/market.
    expect(screen.queryByText("Mã cổ phiếu tiềm năng")).toBeNull();
    expect(screen.queryByText("Nhóm tăng mạnh nhất T+2")).toBeNull();
    expect(screen.queryByText("Dòng tiền tăng đột biến hôm nay")).toBeNull();
    expect(screen.queryByText("Chỉ số chung 3 sàn")).toBeNull();
  });

  it('KHÔNG còn mục "Bản đồ thị trường" riêng — đã gộp vào "Biểu đồ thị trường"', () => {
    renderLayout();

    expect(screen.queryByText("Bản đồ thị trường")).toBeNull();
    expect(screen.queryByText("Bản đồ nhiệt")).toBeNull();
    expect(screen.queryByText("Bản đồ sức mạnh dòng tiền")).toBeNull();
    expect(screen.queryByText("Bản đồ toàn cảnh thị trường")).toBeNull();
    // Không còn submenu nào trong sidebar.
    expect(document.querySelector(".navbar-submenu")).toBeNull();
  });
});

describe("MainLayout — gói đang dùng trên header", () => {
  it("hiển thị VIP + tên gói khi packageRequest đã được duyệt", () => {
    meData.packageRequest = { titles: "1 năm", days: 365, status: "approved" };

    renderLayout();

    expect(screen.getByText("VIP 1 năm")).toBeTruthy();
  });

  it("không hiển thị nhãn VIP khi chưa có gói được duyệt", () => {
    meData.packageRequest = { titles: "90 ngày", days: 90, status: "pending" };

    renderLayout();

    expect(screen.queryByText(/^VIP/)).toBeNull();
  });
});
