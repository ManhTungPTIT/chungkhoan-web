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

    // Tab Trang chủ đi THẲNG vào màn biểu đồ. Bản trước nó mở một tấm trượt bắt chọn 1
    // trong 3 bot; việc chọn bot nay nằm trong thanh công cụ của màn đó.
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));
    expect(screen.getByText("MÀN BIỂU ĐỒ NẾN")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

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

  // Tab Trang chủ cũng phải được đánh dấu như ba tab kia. Bản trước nó cố ý KHÔNG có
  // aria-current vì bấm là mở hộp thoại chứ không điều hướng.
  it("tô sáng tab Trang chủ khi đang ở màn biểu đồ", () => {
    renderApp("/?symbol=HPG&bot=t");
    expect(screen.getByRole("button", { name: "Trang chủ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
