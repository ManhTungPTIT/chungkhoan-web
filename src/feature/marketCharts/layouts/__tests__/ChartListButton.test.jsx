import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ChartListButton from "../ChartListButton";
import { MARKET_CHARTS } from "../../untils/chartList";
import { buildDefaultVisibility } from "../../untils/chartVisibility";

afterEach(cleanup);

// Hiện hash hiện tại ra DOM để khẳng định nút có điều hướng thật.
function HashProbe() {
  const location = useLocation();
  return <span data-testid="hash">{location.hash}</span>;
}

// Đóng vai MarketChartsPage: giữ state hiện/ẩn và bơm xuống nút danh sách.
function Host({ initialVisible }) {
  const [visible, setVisible] = useState(initialVisible ?? buildDefaultVisibility());

  return (
    <>
      <ChartListButton
        visible={visible}
        onToggleChart={(id) => setVisible((v) => ({ ...v, [id]: !v[id] }))}
        onShowChart={(id) => setVisible((v) => ({ ...v, [id]: true }))}
        onShowAll={() => setVisible(buildDefaultVisibility())}
        onHideAll={() =>
          setVisible(
            MARKET_CHARTS.reduce((next, chart) => {
              next[chart.id] = false;
              return next;
            }, {}),
          )
        }
      />
      <HashProbe />
    </>
  );
}

function renderButton(initialEntry = "/chart/market", initialVisible) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/chart/market" element={<Host initialVisible={initialVisible} />} />
      </Routes>
    </MemoryRouter>,
  );
}

const trigger = () => screen.getByRole("button", { name: "Danh sách các biểu đồ" });
const checkboxFor = (label) => screen.getByRole("checkbox", { name: `Hiện biểu đồ ${label}` });

describe("ChartListButton", () => {
  it("chỉ hiện nút, chưa xổ danh sách trước khi bấm", () => {
    renderButton();

    expect(trigger()).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("bấm nút thì xổ đủ tên mọi biểu đồ", () => {
    renderButton();

    fireEvent.click(trigger());

    expect(screen.getAllByRole("menuitem")).toHaveLength(MARKET_CHARTS.length);
    expect(screen.getByText("BỘ LỌC MÃ TĂNG MẠNH NHẤT (NGẮN HẠN: T+2)")).toBeTruthy();
    expect(screen.getByText("BỘ LỌC MÃ TĂNG MẠNH NHẤT TUẦN")).toBeTruthy();
  });

  it("chọn một biểu đồ thì đặt hash tương ứng và đóng danh sách", () => {
    renderButton();

    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("BỘ LỌC MÃ TĂNG MẠNH NHẤT (NGẮN HẠN: T+3)"));

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
    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("BỘ LỌC MÃ TĂNG MẠNH NHẤT (NGẮN HẠN: T+2)"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    section.remove();
  });

  it("bấm ra ngoài thì đóng danh sách", () => {
    renderButton();

    fireEvent.click(trigger());
    expect(screen.queryByRole("menu")).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("ChartListButton — tích chọn biểu đồ hiện", () => {
  it("mặc định mọi biểu đồ đều được tích", () => {
    renderButton();

    fireEvent.click(trigger());

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(MARKET_CHARTS.length);
    expect(boxes.every((box) => box.checked)).toBe(true);
  });

  it("bỏ tích một biểu đồ nhưng KHÔNG đóng menu (còn tích tiếp)", () => {
    renderButton();

    fireEvent.click(trigger());
    fireEvent.click(checkboxFor("BẢN ĐỒ NHIỆT THỊ TRƯỜNG"));

    expect(checkboxFor("BẢN ĐỒ NHIỆT THỊ TRƯỜNG").checked).toBe(false);
    expect(checkboxFor("BỘ LỌC MÃ TIỀM NĂNG LƯỚT T+").checked).toBe(true);
    expect(screen.queryByRole("menu")).toBeTruthy();
  });

  it("bỏ hết rồi chọn tất cả thì quay lại hiện hết", () => {
    renderButton();

    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("Bỏ hết"));
    expect(screen.getAllByRole("checkbox").every((box) => box.checked)).toBe(false);

    fireEvent.click(screen.getByText("Chọn tất cả"));
    expect(screen.getAllByRole("checkbox").every((box) => box.checked)).toBe(true);
  });

  it("bấm TÊN của biểu đồ đang ẩn thì bật lại rồi mới nhảy tới", () => {
    renderButton("/chart/market", { ...buildDefaultVisibility(), heatmap: false });

    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("BẢN ĐỒ NHIỆT THỊ TRƯỜNG"));

    expect(screen.getByTestId("hash").textContent).toBe("#heatmap");

    fireEvent.click(trigger());
    expect(checkboxFor("BẢN ĐỒ NHIỆT THỊ TRƯỜNG").checked).toBe(true);
  });
});

describe("MARKET_CHARTS", () => {
  it("id là duy nhất và mục nào cũng có nhãn", () => {
    const ids = MARKET_CHARTS.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(MARKET_CHARTS.every((c) => c.label.trim().length > 0)).toBe(true);
  });

  it("mọi id đều trỏ tới một <ChartSection> có thật trong trang, đúng thứ tự cuộn", () => {
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
