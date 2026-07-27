import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ChartListButton from "../ChartListButton";
import { MARKET_CHARTS } from "../../untils/chartList";

afterEach(cleanup);

// Hiện hash hiện tại ra DOM để khẳng định nút có điều hướng thật.
function HashProbe() {
  const location = useLocation();
  return <span data-testid="hash">{location.hash}</span>;
}

function renderButton(initialEntry = "/chart/market") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/chart/market"
          element={
            <>
              <ChartListButton />
              <HashProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChartListButton", () => {
  it("chỉ hiện nút, chưa xổ danh sách trước khi bấm", () => {
    renderButton();

    expect(screen.getByText("Danh sách các biểu đồ")).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("bấm nút thì xổ đủ tên mọi biểu đồ", () => {
    renderButton();

    fireEvent.click(screen.getByText("Danh sách các biểu đồ"));

    expect(screen.getAllByRole("menuitem")).toHaveLength(MARKET_CHARTS.length);
    expect(screen.getByText("Nhóm tăng mạnh nhất T+2")).toBeTruthy();
    expect(screen.getByText("Top tăng mạnh nhất tuần")).toBeTruthy();
  });

  it("chọn một biểu đồ thì đặt hash tương ứng và đóng danh sách", () => {
    renderButton();

    fireEvent.click(screen.getByText("Danh sách các biểu đồ"));
    fireEvent.click(screen.getByText("Nhóm tăng mạnh nhất T+3"));

    expect(screen.getByTestId("hash").textContent).toBe("#top-gain-t3");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("chọn lại đúng mục đang xem thì tự cuộn (hash không đổi nên effect trang không chạy)", () => {
    const scrollIntoView = vi.fn();
    const section = document.createElement("section");
    section.id = "top-gain-t2";
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);

    renderButton("/chart/market#top-gain-t2");
    fireEvent.click(screen.getByText("Danh sách các biểu đồ"));
    fireEvent.click(screen.getByText("Nhóm tăng mạnh nhất T+2"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    section.remove();
  });

  it("bấm ra ngoài thì đóng danh sách", () => {
    renderButton();

    fireEvent.click(screen.getByText("Danh sách các biểu đồ"));
    expect(screen.queryByRole("menu")).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("MARKET_CHARTS", () => {
  it("id là duy nhất và mục nào cũng có nhãn", () => {
    const ids = MARKET_CHARTS.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(MARKET_CHARTS.every((c) => c.label.trim().length > 0)).toBe(true);
  });

  it("mọi id đều trỏ tới một <section> có thật trong trang, đúng thứ tự cuộn", () => {
    // Đọc thẳng source trang: nút nhảy vô dụng nếu id không khớp section, mà
    // render cả trang trong test thì phải mock hơn 20 chart.
    const page = readFileSync(
      resolve(process.cwd(), "src/feature/marketCharts/index.jsx"),
      "utf-8",
    );
    const sectionIds = [...page.matchAll(/^\s*id="([a-z0-9-]+)"/gm)].map((m) => m[1]);
    const listIds = MARKET_CHARTS.map((c) => c.id);

    expect(listIds.filter((id) => !sectionIds.includes(id))).toEqual([]);
    expect(sectionIds.filter((id) => listIds.includes(id))).toEqual(listIds);
  });
});
