import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import AccountMenu from "../AccountMenu";

const navigate = vi.fn();
const logout = vi.fn();

let meData;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("../../hooks/useMe", () => ({
  useMe: () => ({ data: meData, isLoading: false, isError: false }),
}));

vi.mock("../../services/loginUserService", () => ({
  LoginUserService: () => ({ logout }),
}));

beforeEach(() => {
  meData = {
    id: "user-1",
    fullName: "Nguyen Van A",
    email: "user@example.com",
    role: "user",
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const renderMenu = () =>
  render(
    <MemoryRouter>
      <AccountMenu />
    </MemoryRouter>,
  );

describe("AccountMenu", () => {
  it("hiện đủ ba mục cho người dùng thường", () => {
    renderMenu();

    expect(screen.getByRole("button", { name: /thông tin cá nhân/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đổi mật khẩu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /gói đăng ký/i })).toBeInTheDocument();
  });

  it("bấm một mục thì sang đúng route con", () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /đổi mật khẩu/i }));
    expect(navigate).toHaveBeenCalledWith("/info/password");
  });

  it("admin không thấy mục Gói đăng ký", () => {
    meData.role = "admin";
    renderMenu();

    expect(screen.getByRole("button", { name: /thông tin cá nhân/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /gói đăng ký/i })).toBeNull();
  });

  it("đăng xuất: chuyển về /login rồi mới thu hồi token", () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /đăng xuất/i }));

    // Thứ tự quan trọng: service tự điều hướng kể cả khi API lỗi, gọi ngược lại sẽ có một
    // nhịp màn hình trống.
    expect(navigate).toHaveBeenCalledWith("/login");
    expect(logout).toHaveBeenCalled();
    expect(navigate.mock.invocationCallOrder[0]).toBeLessThan(
      logout.mock.invocationCallOrder[0],
    );
  });
});
