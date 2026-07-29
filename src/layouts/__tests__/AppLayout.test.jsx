import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AppLayout from "../AppLayout";

afterEach(cleanup);

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
    for (const label of ["Bot", "Bộ lọc", "Biểu đồ", "Tài khoản"]) {
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
});

describe("bottom sheet chọn bot", () => {
  it("không hiện trước khi bấm tab Bot", () => {
    renderApp();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("bấm Bot thì hiện đủ ba loại bot", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Bot" }));

    expect(screen.getByRole("dialog", { name: "Chọn BOT" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BOT Trend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BOT T+" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BOT Dài hạn" })).toBeInTheDocument();
  });

  it("chọn bot thì đóng tấm trượt và giữ mã đang xem", () => {
    renderApp("/?symbol=HPG&bot=trend");
    fireEvent.click(screen.getByRole("button", { name: "Bot" }));
    fireEvent.click(screen.getByRole("button", { name: "BOT T+" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Điều hướng tới "/" giữ nguyên symbol — màn nến vẫn đứng ở mã cũ.
    expect(screen.getByText("MÀN BIỂU ĐỒ NẾN")).toBeInTheDocument();
  });

  it("chạm ra ngoài thì đóng", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Bot" }));

    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("nhấn Escape thì đóng", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Bot" }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
