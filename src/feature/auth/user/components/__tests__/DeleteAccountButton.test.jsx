import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DeleteAccountButton from "../DeleteAccountButton";
import ProfileForm from "../ProfileForm";

const deleteMutate = vi.fn();
const clearTokens = vi.fn();
const goToLogin = vi.fn();
let meData;

vi.mock("../../../untils/loginRedirect", () => ({
  goToLogin: (...args) => goToLogin(...args),
}));

vi.mock("../../hooks/useDeleteAccount", () => ({
  useDeleteAccount: () => ({ mutate: deleteMutate, isPending: false }),
}));

vi.mock("../../../admin/untils/tokenStorage", () => ({
  clearTokens: (...args) => clearTokens(...args),
}));

vi.mock("../../hooks/useMe", () => ({
  useMe: () => ({ data: meData, isLoading: false, isError: false }),
}));

function openModal() {
  render(<DeleteAccountButton />);
  fireEvent.click(screen.getByRole("button", { name: /^xóa tài khoản$/i }));
}

beforeEach(() => {
  meData = { id: "u1", fullName: "Nguyen Van A", role: "user" };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("DeleteAccountSection", () => {
  it("bấm nút mở modal xác nhận, bấm Hủy thì đóng lại", () => {
    openModal();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hủy/i }));
    expect(screen.queryByLabelText(/mật khẩu/i)).not.toBeInTheDocument();
  });

  it("để trống mật khẩu → báo lỗi tại chỗ, KHÔNG gọi API", () => {
    openModal();
    fireEvent.click(screen.getByRole("button", { name: /xác nhận xóa/i }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/vui lòng nhập mật khẩu/i)).toBeInTheDocument();
  });

  it("mật khẩu sai → hiện thông điệp của server, modal vẫn mở", () => {
    openModal();
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
      target: { value: "sai" },
    });
    fireEvent.click(screen.getByRole("button", { name: /xác nhận xóa/i }));

    const [, handlers] = deleteMutate.mock.calls[0];
    // onError do react-query gọi ngoài vòng render — tự gọi tay thì phải bọc act()
    // để React kịp áp state trước khi khẳng định.
    act(() =>
      handlers.onError({
        response: { data: { message: "Mật khẩu không chính xác" } },
      }),
    );

    expect(screen.getByText("Mật khẩu không chính xác")).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
  });

  it("xóa thành công → dọn token và về /login?reason=deleted", () => {
    openModal();
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /xác nhận xóa/i }));

    const [payload, handlers] = deleteMutate.mock.calls[0];
    expect(payload).toEqual({ password: "secret" });

    handlers.onSuccess();
    expect(clearTokens).toHaveBeenCalled();
    expect(goToLogin).toHaveBeenCalledWith("deleted");
  });
});

describe("ProfileForm — nút xóa tài khoản", () => {
  it("người dùng thường thấy nút xóa, đứng cùng hàng với nút Cập nhật", () => {
    const { container } = render(<ProfileForm />);

    const foot = container.querySelector(".iu-form__foot");
    expect(foot).toHaveTextContent("Xóa tài khoản");
    expect(foot).toHaveTextContent("Cập nhật");
  });

  // Modal cũng là một <form>, mà nút mở nó nằm trong form của ProfileForm. Không
  // portal ra ngoài thì thành form lồng form — trình duyệt tự gỡ thẻ trong và nút
  // "Xác nhận xóa" mất tác dụng submit.
  it("modal không nằm lồng trong form hồ sơ", () => {
    const { container } = render(<ProfileForm />);
    fireEvent.click(screen.getByRole("button", { name: /^xóa tài khoản$/i }));

    const profileForm = container.querySelector(".iu-form");
    expect(profileForm.querySelector(".iu-modal")).toBeNull();
    expect(document.querySelector(".iu-modal")).not.toBeNull();
  });

  // Tài khoản admin nằm ở collection Admin của BE — endpoint xóa chỉ tra User nên
  // sẽ trả 404. Ẩn hẳn thay vì để họ bấm rồi nhận lỗi khó hiểu.
  it("tài khoản admin KHÔNG thấy khối xóa tài khoản", () => {
    meData = { id: "a1", fullName: "Admin", role: "admin" };
    render(<ProfileForm />);
    expect(
      screen.queryByRole("button", { name: /^xóa tài khoản$/i }),
    ).not.toBeInTheDocument();
  });
});
