import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import BotSheet from "../BotSheet";

// Mock riêng `useNavigate` để soi được "có gọi hay không" — ca "chọn trúng bot
// đang xem thì KHÔNG điều hướng" không quan sát được qua màn hình, vì cả hai
// nhánh đều dẫn tới cùng một URL.
//
// `vi.hoisted` là bắt buộc: vitest kéo `vi.mock` lên đầu file, nên một `const
// navigate = vi.fn()` viết thường sẽ chưa tồn tại lúc factory chạy → "Cannot
// access 'navigate' before initialization".
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigate };
});

afterEach(() => {
  cleanup();
  navigate.mockClear();
});

function renderSheet(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  render(
    <MemoryRouter initialEntries={["/?symbol=HPG&bot=trend"]}>
      <BotSheet open bot="trend" {...props} onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose };
}

describe("BotSheet", () => {
  it("đóng thì không render gì", () => {
    renderSheet({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hiện đủ ba bot với nhãn đầy đủ", () => {
    renderSheet();
    expect(screen.getByRole("dialog", { name: "Chọn BOT" })).toBeInTheDocument();
    for (const label of ["BOT Trend", "BOT T+", "BOT Dài hạn"]) {
      expect(screen.getByRole("menuitemradio", { name: label })).toBeInTheDocument();
    }
  });

  // Vấn đề của bản cũ: ba mục render như nhau, mở ra không biết mình đang ở đâu.
  it("đánh dấu bot đang xem", () => {
    renderSheet({ bot: "long" });
    expect(
      screen.getByRole("menuitemradio", { name: "BOT Dài hạn" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: "BOT Trend" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("chọn bot khác thì điều hướng, giữ mã đang xem, rồi đóng", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "BOT T+" }));

    expect(navigate).toHaveBeenCalledWith("/?symbol=HPG&bot=t");
    expect(onClose).toHaveBeenCalled();
  });

  // navigate tới đúng URL đang đứng vẫn đẻ một mục lịch sử → bấm back một lần
  // không đi đâu cả.
  it("chọn trúng bot đang xem thì chỉ đóng, không điều hướng", () => {
    const { onClose } = renderSheet({ bot: "trend" });
    fireEvent.click(screen.getByRole("menuitemradio", { name: "BOT Trend" }));

    expect(navigate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("nhấn Escape thì đóng", () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("chạm ra ngoài thì đóng", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("chạm vào trong tấm trượt thì KHÔNG đóng", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
