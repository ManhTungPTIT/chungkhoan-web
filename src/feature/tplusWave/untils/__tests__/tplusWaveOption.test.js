import { describe, it, expect } from "vitest";
import {
  buildRadarOption,
  buildSquareGridGraphic,
  buildSeriesRayGraphic,
  buildZonedPayload,
  computeAxisBounds,
  metaForWindows,
  windowsFromPayload,
  SERIES_META,
  GRID_SPLIT_NUMBER,
  CENTER_X_RATIO,
  CENTER_Y_RATIO,
  RADAR_RADIUS_RATIO,
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

describe("cửa sổ T+ tùy ý (windows động)", () => {
  it("metaForWindows: sort tăng dần, gán màu theo thứ tự (nhỏ→vàng, lớn→tím)", () => {
    const meta = metaForWindows([7, 2, 4]);
    expect(meta.map((m) => m.key)).toEqual(["t2", "t4", "t7"]);
    expect(meta.map((m) => m.name)).toEqual([
      "Tăng cao nhất T+2",
      "Tăng cao nhất T+4",
      "Tăng cao nhất T+7",
    ]);
    expect(meta.map((m) => m.color)).toEqual(["#F2B600", "#1E8B3B", "#7B1FA2"]);
  });

  it("windowsFromPayload: ưu tiên payload.windows, rồi key zones/series", () => {
    expect(windowsFromPayload({ windows: [5, 2, 4] })).toEqual([2, 4, 5]);
    expect(windowsFromPayload({ series: { t4: [], t2: [] } })).toEqual([2, 4]);
    expect(windowsFromPayload({})).toEqual([2, 3, 5]);
  });

  it("buildRadarOption dùng windows tùy ý cho legend/màu", () => {
    const opt = buildRadarOption({
      windows: [2, 4, 7],
      symbols: ["A"],
      series: { t2: [1], t4: [2], t7: [3] },
    });
    expect(opt.legend.data).toEqual([
      "Tăng cao nhất T+2",
      "Tăng cao nhất T+4",
      "Tăng cao nhất T+7",
    ]);
  });
});

describe("buildZonedPayload", () => {
  // Radar 3 VÙNG: mỗi cửa sổ T+ một vùng góc riêng với top mã của RIÊNG nó.
  // Thứ tự vùng [t5, t3, t2] (echarts đi ngược chiều kim đồng hồ từ đỉnh):
  // tím T+5 trên→trái, xanh T+3 dưới, vàng T+2 phải — khớp hình mẫu.
  const zoned = {
    zones: {
      t2: { symbols: ["GEX", "CTS"], values: [720, 300] },
      t3: { symbols: ["GEX", "VCG"], values: [600, 200] },
      t5: { symbols: ["VPX"], values: [250] },
    },
  };

  it("ghép trục theo thứ tự vùng t5→t3→t2, mỗi series chỉ có giá trị trong vùng mình", () => {
    const p = buildZonedPayload(zoned);

    expect(p.symbols).toEqual(["VPX", "GEX", "VCG", "GEX", "CTS"]);
    expect(p.series.t5).toEqual([250, 0, 0, 0, 0]);
    expect(p.series.t3).toEqual([0, 600, 200, 0, 0]);
    expect(p.series.t2).toEqual([0, 0, 0, 720, 300]);
  });

  it("nhãn trục tô màu theo vùng (tím/xanh/vàng)", () => {
    const p = buildZonedPayload(zoned);
    const [purple, green, yellow] = [
      SERIES_META.find((m) => m.key === "t5").color,
      SERIES_META.find((m) => m.key === "t3").color,
      SERIES_META.find((m) => m.key === "t2").color,
    ];
    expect(p.axisColors).toEqual([purple, green, green, yellow, yellow]);
  });

  it("payload không có zones (BE cũ) → null để caller dùng shape cũ", () => {
    expect(buildZonedPayload({ symbols: ["A"], series: { t2: [1] } })).toBeNull();
    expect(buildZonedPayload(null)).toBeNull();
  });
});

describe("buildRadarOption với axisColors", () => {
  it("indicator nhận màu theo vùng khi payload có axisColors", () => {
    const p = {
      symbols: ["VPX", "GEX"],
      series: { t2: [0, 720], t3: [0, 0], t5: [250, 0] },
      axisColors: ["#7B1FA2", "#F2B600"],
    };
    const opt = buildRadarOption(p);
    expect(opt.radar.indicator[0].color).toBe("#7B1FA2");
    expect(opt.radar.indicator[1].color).toBe("#F2B600");
  });
});

describe("buildSeriesRayGraphic", () => {
  // Tia màu theo series: từ TÂM tới điểm giá trị trên trục mỗi mã (không nối
  // polygon vòng quanh). Góc phải TRÙNG công thức echarts radar (clockwise=false,
  // startAngle=90): góc_i = 90° + i·360°/n; điểm = (cx + r·cosθ, cy − r·sinθ).
  const payload2 = {
    symbols: ["A", "B", "C", "D"],
    series: { t2: [60, 0, 0, 0], t3: [0, 30, 0, 0], t5: [0, 0, 0, 15] },
  };
  const bounds = { axisMin: 0, axisMax: 60 };
  const W = 800;
  const H = 600;
  const cx = W * CENTER_X_RATIO;
  const cy = H * CENTER_Y_RATIO;
  const R = (Math.min(W, H) / 2) * RADAR_RADIUS_RATIO;

  it("mỗi giá trị > 0 sinh 1 tia line màu series, nằm dưới series echarts (z<10)", () => {
    const els = buildSeriesRayGraphic(W, H, bounds, payload2);
    const lines = els.filter((e) => e.type === "line");
    // t2: 1 giá trị >0, t3: 1, t5: 1 → 3 tia
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.z < 10 && l.silent)).toBe(true);
    expect(lines.map((l) => l.style.stroke)).toEqual([
      SERIES_META[0].color,
      SERIES_META[1].color,
      SERIES_META[2].color,
    ]);
  });

  it("tia mã đầu (index 0) hướng THẲNG LÊN TRÊN (góc 90°), độ dài theo giá trị", () => {
    const els = buildSeriesRayGraphic(W, H, bounds, payload2);
    const ray = els.find((e) => e.type === "line" && e.style.stroke === SERIES_META[0].color);
    // A = symbols[0], t2 = 60 = axisMax → tia dài đúng R, thẳng lên trên
    expect(ray.shape.x1).toBeCloseTo(cx);
    expect(ray.shape.y1).toBeCloseTo(cy);
    expect(ray.shape.x2).toBeCloseTo(cx);
    expect(ray.shape.y2).toBeCloseTo(cy - R);
  });

  it("tia mã index 1 (n=4) hướng sang TRÁI (góc 180°) — ngược chiều kim đồng hồ như echarts", () => {
    const els = buildSeriesRayGraphic(W, H, bounds, payload2);
    const ray = els.find((e) => e.type === "line" && e.style.stroke === SERIES_META[1].color);
    // B = symbols[1], t3 = 30 = nửa thang → r = R/2, góc 90+90=180° → bên trái
    expect(ray.shape.x2).toBeCloseTo(cx - R / 2);
    expect(ray.shape.y2).toBeCloseTo(cy);
  });

  it("giá trị 0/null không sinh tia; width=0 → rỗng", () => {
    const els = buildSeriesRayGraphic(W, H, bounds, {
      symbols: ["A"],
      series: { t2: [0], t3: [null], t5: [] },
    });
    expect(els.filter((e) => e.type === "line")).toHaveLength(0);
    expect(buildSeriesRayGraphic(0, 0, bounds, payload2)).toEqual([]);
  });
});
