import { describe, it, expect } from "vitest";
import {
  buildRadarOption,
  buildSquareGridGraphic,
  computeAxisBounds,
  SERIES_META,
  GRID_SPLIT_NUMBER,
} from "../tplusWaveOption";

const payload = {
  symbols: ["CVN", "DDG", "HSL"],
  series: {
    t2: [16.67, 18.18, -0.2],
    t3: [33.33, 27.27, 5],
    t5: [58.33, 27.27, 20],
  },
  max_value: 58.33,
};

describe("computeAxisBounds", () => {
  it("max làm tròn lên bội 10, min xuống dưới 0 khi có giá trị âm", () => {
    expect(computeAxisBounds(payload)).toEqual({ axisMin: -10, axisMax: 60 });
  });

  it("min = 0 khi mọi giá trị không âm", () => {
    const b = computeAxisBounds({ series: { t2: [5], t3: [8], t5: [12] } });
    expect(b).toEqual({ axisMin: 0, axisMax: 20 });
  });
});

describe("buildRadarOption", () => {
  it("tạo 1 indicator cho mỗi mã với thang min/max dùng chung", () => {
    const opt = buildRadarOption(payload);
    expect(opt.radar.indicator).toHaveLength(3);
    expect(opt.radar.indicator[0]).toMatchObject({ name: "CVN", min: -10, max: 60 });
  });

  it("tắt lưới đa giác mặc định (splitLine/splitArea/axisLabel) để nhường lưới vuông", () => {
    const opt = buildRadarOption(payload);
    expect(opt.radar.splitLine.show).toBe(false);
    expect(opt.radar.splitArea.show).toBe(false);
    expect(opt.radar.axisLabel.show).toBe(false);
    expect(opt.radar.axisLine.show).toBe(true); // vẫn giữ nan hoa
  });

  it("3 series đúng tên, màu khớp legend mẫu, vẽ trên lưới (z cao)", () => {
    const opt = buildRadarOption(payload);
    expect(opt.series[0].z).toBeGreaterThan(0);
    expect(opt.series[0].data.map((d) => d.name)).toEqual(
      SERIES_META.map((m) => m.name),
    );
    expect(opt.color).toEqual(["#F2B600", "#1E8B3B", "#7B1FA2"]);
    expect(opt.series[0].data[0].value).toEqual(payload.series.t2);
  });
});

describe("buildSquareGridGraphic", () => {
  const bounds = { axisMin: 0, axisMax: 60 };

  it("sinh N hình vuông đồng tâm + N nhãn, tất cả nằm dưới series (z<10)", () => {
    const els = buildSquareGridGraphic(800, 600, bounds);
    const rects = els.filter((e) => e.type === "rect");
    const texts = els.filter((e) => e.type === "text");
    expect(rects).toHaveLength(GRID_SPLIT_NUMBER);
    expect(texts).toHaveLength(GRID_SPLIT_NUMBER);
    expect(rects.every((r) => r.z < 10 && r.silent)).toBe(true);
  });

  it("các hình vuông đồng tâm (cùng tâm, cạnh tăng dần)", () => {
    const els = buildSquareGridGraphic(800, 600, bounds);
    const rects = els.filter((e) => e.type === "rect");
    const cx = rects.map((r) => r.shape.x + r.shape.width / 2);
    const cy = rects.map((r) => r.shape.y + r.shape.height / 2);
    // cùng tâm
    expect(new Set(cx.map((v) => Math.round(v))).size).toBe(1);
    expect(new Set(cy.map((v) => Math.round(v))).size).toBe(1);
    // cạnh tăng dần
    const sizes = rects.map((r) => r.shape.width);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });

  it("nhãn thang từ axisMin→axisMax theo từng vòng", () => {
    const els = buildSquareGridGraphic(800, 600, { axisMin: 0, axisMax: 50 });
    const texts = els.filter((e) => e.type === "text").map((t) => t.style.text);
    expect(texts).toEqual(["6", "13", "19", "25", "31", "38", "44", "50"]);
  });

  it("width/height = 0 → mảng rỗng (không vỡ)", () => {
    expect(buildSquareGridGraphic(0, 0, bounds)).toEqual([]);
  });
});
