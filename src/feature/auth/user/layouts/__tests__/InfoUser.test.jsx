import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InfoUser from "../InfoUser";

const requestPackageMutate = vi.fn();

vi.mock("../../hooks/useMe", () => ({
  useMe: () => ({
    data: {
      id: "user-1",
      fullName: "Nguyen Van A",
      email: "user@example.com",
      role: "user",
      status: "active",
      expiresAt: "2026-12-31T00:00:00.000Z",
    },
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

    expect(requestPackageMutate).toHaveBeenCalledWith(
      { days: 90 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
