import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InfoUser from "../InfoUser";

const requestPackageMutate = vi.fn();

// Hồ sơ /user/me thay đổi theo từng test — gán trong beforeEach/test.
let meData;

vi.mock("../../hooks/useMe", () => ({
  useMe: () => ({
    data: meData,
    isLoading: false,
    isError: false,
  }),
  useRequestPackage: () => ({
    mutate: requestPackageMutate,
    isPending: false,
  }),
}));

vi.mock("../../hooks/useChangePassword", () => ({
  useChangePassword: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

beforeEach(() => {
  meData = {
    id: "user-1",
    fullName: "Nguyen Van A",
    email: "user@example.com",
    role: "user",
    status: "active",
    expiresAt: "2026-12-31T00:00:00.000Z",
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe("InfoUser subscription package request", () => {
  it("lets the user select a package and send it for admin approval", () => {
    render(
      <MemoryRouter>
        <InfoUser />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /gói đăng ký/i }));
    fireEvent.click(screen.getByRole("button", { name: /90 ngày/i }));
    fireEvent.click(screen.getByRole("button", { name: /gửi yêu cầu duyệt/i }));

    // Regression: FE từng gửi { title } trong khi hook/BE cần { titles } → 400.
    expect(requestPackageMutate).toHaveBeenCalledWith(
      { titles: "90 ngày", days: 90 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});

describe("InfoUser current package display", () => {
  it("shows the approved package as the one in use, with its expiry date", () => {
    meData.packageRequest = {
      titles: "1 năm",
      days: 365,
      status: "approved",
      requestedAt: "2026-06-01T00:00:00.000Z",
    };

    const { container } = render(
      <MemoryRouter>
        <InfoUser />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /gói đăng ký/i }));

    const current = container.querySelector(".iu-package__status--current strong");
    expect(current).toHaveTextContent("1 năm");
    // expiresAt 31/12/2026 (định dạng vi-VN)
    expect(screen.getByText("31/12/2026")).toBeInTheDocument();
  });

  it("does not show a pending request as the package in use", () => {
    meData.packageRequest = {
      titles: "90 ngày",
      days: 90,
      status: "pending",
      requestedAt: "2026-07-01T00:00:00.000Z",
    };

    const { container } = render(
      <MemoryRouter>
        <InfoUser />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /gói đăng ký/i }));

    const current = container.querySelector(".iu-package__status--current strong");
    expect(current).toHaveTextContent("Chưa có");
    // vẫn báo yêu cầu đang chờ duyệt
    expect(screen.getByText(/đang chờ admin duyệt/i)).toBeInTheDocument();
  });
});
