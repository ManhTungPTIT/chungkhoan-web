import { describe, it, expect } from "vitest";
import { buildBullBear, GROUP_COLORS, TOTAL_COLOR } from "../bullBearData";
import { fmtTy } from "../../../../untils/valueBarFormat";

const payload = {
  total_value: 13877e9,
  groups: [
    { key: "bull_green", label: "Phe Bò Xanh", value: 7210e9, pct: 51.96 },
    { key: "neutral", label: "Phe Trung lập", value: 1156e9, pct: 8.33 },
    { key: "bear_red", label: "Phe Gấu Đỏ", value: 5269e9, pct: 37.97 },
    { key: "bull_purple", label: "Phe Bò Tím", value: 43e9, pct: 0.31 },
    { key: "bear_floor", label: "Phe Gấu Sàn", value: 0, pct: 0 },
  ],
};

describe("buildBullBear", () => {
  it("cột đầu là Tổng với 100%", () => {
    const bars = buildBullBear(payload);
    expect(bars[0]).toMatchObject({ key: "total", label: "Tổng", ty: 13877, pct: 100 });
  });

  it("giữ nguyên thứ tự cột của BE, không sort theo giá trị", () => {
    const bars = buildBullBear(payload);
    expect(bars.map((b) => b.key)).toEqual([
      "total",
      "bull_green",
      "neutral",
      "bear_red",
      "bull_purple",
      "bear_floor",
    ]);
  });

  it("nhóm rỗng vẫn giữ cột", () => {
    const bars = buildBullBear(payload);
    const floor = bars.find((b) => b.key === "bear_floor");
    expect(floor).toBeDefined();
    expect(floor.ty).toBe(0);
  });

  it("quy VND về tỷ, làm tròn nguyên", () => {
    const bars = buildBullBear(payload);
    expect(bars.map((b) => b.ty)).toEqual([13877, 7210, 1156, 5269, 43, 0]);
  });

  it("mỗi phe lấy đúng màu quy ước, Tổng dùng màu xám đá riêng", () => {
    const bars = buildBullBear(payload);
    expect(bars[0].color).toBe(TOTAL_COLOR);
    expect(bars[1].color).toBe(GROUP_COLORS.bull_green);
    expect(bars[4].color).toBe(GROUP_COLORS.bull_purple);
  });

  it("payload rỗng/rác → không có cột nào (không dựng cột Tổng mồ côi)", () => {
    expect(buildBullBear(null)).toEqual([]);
    expect(buildBullBear({})).toEqual([]);
    expect(buildBullBear({ total_value: 100, groups: [] })).toEqual([]);
  });

  it("tổng = 0 (ngoài phiên) → Tổng hiện 0% thay vì 100%", () => {
    const bars = buildBullBear({
      total_value: 0,
      groups: [{ key: "neutral", label: "Phe Trung lập", value: 0, pct: 0 }],
    });
    expect(bars[0].pct).toBe(0);
  });

  it("bỏ phần tử thiếu key", () => {
    const bars = buildBullBear({
      total_value: 10,
      groups: [{ label: "rác" }, { key: "neutral", label: "Phe Trung lập", value: 10, pct: 100 }],
    });
    expect(bars.map((b) => b.key)).toEqual(["total", "neutral"]);
  });
});

describe("fmtTy", () => {
  it("có dấu phân cách nghìn", () => {
    expect(fmtTy(13877)).toBe((13877).toLocaleString("vi-VN"));
  });
});
