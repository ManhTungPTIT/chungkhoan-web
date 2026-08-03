import { describe, expect, it } from "vitest";
import { MARKET_CHARTS } from "../chartList";
import {
  CHART_VISIBILITY_STORAGE_KEY,
  buildDefaultVisibility,
  loadChartVisibility,
  saveChartVisibility,
} from "../chartVisibility";

function fakeStorage(initial) {
  const map = new Map(initial ? [[CHART_VISIBILITY_STORAGE_KEY, initial]] : []);
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    read: () => map.get(CHART_VISIBILITY_STORAGE_KEY),
  };
}

describe("loadChartVisibility", () => {
  it("chưa lưu gì thì hiện hết", () => {
    const visible = loadChartVisibility(fakeStorage());

    expect(Object.keys(visible)).toHaveLength(MARKET_CHARTS.length);
    expect(Object.values(visible).every(Boolean)).toBe(true);
  });

  it("ẩn đúng những id đã lưu, còn lại vẫn hiện", () => {
    const storage = fakeStorage(JSON.stringify({ hidden: ["heatmap", "top-value"] }));

    const visible = loadChartVisibility(storage);

    expect(visible["heatmap"]).toBe(false);
    expect(visible["top-value"]).toBe(false);
    expect(visible["potential-flow"]).toBe(true);
  });

  it("biểu đồ mới thêm vào danh sách vẫn hiện dù storage cũ không nhắc tới", () => {
    const storage = fakeStorage(JSON.stringify({ hidden: ["heatmap"] }));
    const charts = [...MARKET_CHARTS, { id: "chart-moi-tinh", label: "Biểu đồ mới" }];

    expect(loadChartVisibility(storage, charts)["chart-moi-tinh"]).toBe(true);
  });

  it("bỏ qua id không còn trong danh sách", () => {
    const storage = fakeStorage(JSON.stringify({ hidden: ["bieu-do-da-xoa"] }));

    const visible = loadChartVisibility(storage);

    expect(visible).not.toHaveProperty("bieu-do-da-xoa");
    expect(Object.values(visible).every(Boolean)).toBe(true);
  });

  it("JSON hỏng hoặc schema lạ thì hiện hết, không làm trang trắng", () => {
    expect(loadChartVisibility(fakeStorage("{khong-phai-json"))).toEqual(
      buildDefaultVisibility(),
    );
    expect(loadChartVisibility(fakeStorage(JSON.stringify({ hidden: "heatmap" })))).toEqual(
      buildDefaultVisibility(),
    );
  });

  it("không có localStorage cũng chạy được", () => {
    expect(loadChartVisibility(null)).toEqual(buildDefaultVisibility());
  });
});

describe("saveChartVisibility", () => {
  it("chỉ ghi danh sách id bị ẩn", () => {
    const storage = fakeStorage();

    saveChartVisibility({ ...buildDefaultVisibility(), heatmap: false }, storage);

    expect(JSON.parse(storage.read())).toEqual({ hidden: ["heatmap"] });
  });

  it("lưu rồi đọc lại ra đúng trạng thái cũ", () => {
    const storage = fakeStorage();
    const visible = { ...buildDefaultVisibility(), heatmap: false, "bull-bear": false };

    saveChartVisibility(visible, storage);

    expect(loadChartVisibility(storage)).toEqual(visible);
  });

  it("storage ném lỗi (chế độ ẩn danh) thì nuốt lỗi", () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };

    expect(() => saveChartVisibility(buildDefaultVisibility(), throwing)).not.toThrow();
  });
});
