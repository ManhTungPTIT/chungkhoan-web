import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AppLayout from "../AppLayout";

// Dọn cả localStorage: ca "URL không có bot thì rơi về mặc định" đọc `loadBot()`,
// mà loadBot đọc localStorage thật của jsdom — dùng chung cho mọi ca trong file.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>MÀN BIỂU ĐỒ NẾN</div>} />
          <Route path="/chart/filter" element={<div>BỘ LỌC</div>} />
          <Route path="/chart/market" element={<div>BIỂU ĐỒ THỊ TRƯỜNG</div>} />
          <Route path="/info" element={<div>TÀI KHOẢN</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("thanh tab", () => {
  it("hiện đúng bốn tab", () => {
    renderApp();
    for (const label of ["Trang chủ", "Bộ lọc", "Biểu đồ", "Tài khoản"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("không còn sidebar của bản web", () => {
    renderApp();
    expect(screen.queryByText("Biểu đồ thị trường")).not.toBeInTheDocument();
    expect(screen.queryByText("BOT Dài hạn")).not.toBeInTheDocument();
  });

  it("điều hướng tới đúng trang khi bấm tab", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Bộ lọc" }));
    expect(screen.getByText("BỘ LỌC")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Biểu đồ" }));
    expect(screen.getByText("BIỂU ĐỒ THỊ TRƯỜNG")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(screen.getByText("TÀI KHOẢN")).toBeInTheDocument();
  });

  it("tô sáng tab ứng với trang đang mở", () => {
    renderApp("/chart/market");
    expect(screen.getByRole("button", { name: "Biểu đồ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Bộ lọc" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  // Tab Trang chủ tuy mở tấm trượt chứ không điều hướng ngay, nhưng "/" vẫn là đích
  // thật của nó nên phải được đánh dấu như ba tab kia.
  it("tô sáng tab Trang chủ khi đang ở màn biểu đồ", () => {
    renderApp("/?symbol=HPG&bot=t");
    expect(screen.getByRole("button", { name: "Trang chủ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("bottom sheet chọn bot", () => {
  it("không hiện trước khi bấm tab Trang chủ", () => {
    renderApp();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("bấm Trang chủ thì hiện đủ ba loại bot", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));

    expect(screen.getByRole("dialog", { name: "Chọn BOT" })).toBeInTheDocument();
    for (const label of ["BOT Trend", "BOT T+", "BOT Dài hạn"]) {
      expect(screen.getByRole("menuitemradio", { name: label })).toBeInTheDocument();
    }
  });

  it("nút Trang chủ khai báo là nút mở hộp thoại", () => {
    renderApp();
    const tab = screen.getByRole("button", { name: "Trang chủ" });

    expect(tab).toHaveAttribute("aria-haspopup", "dialog");
    expect(tab).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(tab);
    expect(tab).toHaveAttribute("aria-expanded", "true");
  });

  // Tấm trượt đè lên màn đang xem; chỉ khi CHỌN mới điều hướng. Đóng mà không chọn
  // thì ở lại đúng chỗ cũ.
  it("mở từ màn khác thì không rời màn đó", () => {
    renderApp("/chart/filter");
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));
    expect(screen.getByText("BỘ LỌC")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("BỘ LỌC")).toBeInTheDocument();
  });

  it("chọn bot thì đóng tấm trượt và giữ mã đang xem", () => {
    renderApp("/?symbol=HPG&bot=trend");
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "BOT T+" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Điều hướng tới "/" giữ nguyên symbol — màn nến vẫn đứng ở mã cũ.
    expect(screen.getByText("MÀN BIỂU ĐỒ NẾN")).toBeInTheDocument();
  });

  // Bot đang xem đọc từ `?bot=` trên URL. Đây là thứ AppLayout phải tự lấy rồi
  // truyền xuống — tấm trượt không tự biết.
  it("đánh dấu đúng bot trên URL", () => {
    renderApp("/?bot=long");
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));

    expect(
      screen.getByRole("menuitemradio", { name: "BOT Dài hạn" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  // URL không có `?bot=` (vd đang ở Bộ lọc) → rơi về trí nhớ, mà trí nhớ rỗng
  // trong jsdom → trend.
  it("URL không có bot thì rơi về mặc định", () => {
    renderApp("/chart/filter");
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));

    expect(
      screen.getByRole("menuitemradio", { name: "BOT Trend" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("chạm ra ngoài thì đóng", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));

    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("bấm tab Trang chủ lần nữa thì đóng", () => {
    renderApp();
    const tab = screen.getByRole("button", { name: "Trang chủ" });

    fireEvent.click(tab);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(tab);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
