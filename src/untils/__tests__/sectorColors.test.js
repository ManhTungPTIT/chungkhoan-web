import { describe, it, expect } from "vitest";
import {
  assignSectorColors,
  buildPalette,
  colorForSector,
  labelInk,
  UNCLASSIFIED,
} from "../sectorColors";

const mk = (codes) => codes.map((c) => ({ icb_code: c, name: `N${c}` }));

describe("buildPalette", () => {
  it("24 tổ hợp (8 hue × 3 bậc), không trùng nhau", () => {
    for (const dark of [false, true]) {
      const p = buildPalette(dark);
      expect(p).toHaveLength(24);
      expect(new Set(p).size).toBe(24);
      for (const hex of p) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("8 slot đầu đúng bảng hue gốc đã validate CVD", () => {
    expect(buildPalette(false).slice(0, 8)).toEqual([
      "#2a78d6",
      "#eb6834",
      "#1baf7a",
      "#eda100",
      "#e87ba4",
      "#008300",
      "#4a3aa7",
      "#e34948",
    ]);
    expect(buildPalette(true)[0]).toBe("#3987e5");
  });
});

describe("assignSectorColors", () => {
  it("cùng icb_code luôn ra cùng màu bất kể thứ hạng", () => {
    const a = assignSectorColors(mk(["8355", "8633", "1757"]));
    const b = assignSectorColors(mk(["8355"]));
    expect(b.get("8355")).toBe(a.get("8355"));
  });

  // Hợp đồng quan trọng nhất của module: đọc chéo được giữa các biểu đồ.
  it("cùng ngành ra cùng màu dù tập ngành của hai biểu đồ khác nhau", () => {
    const bieuDoA = assignSectorColors(mk(["8355", "8633", "1757", "0570"]));
    const bieuDoB = assignSectorColors(mk(["1757", "5751"]));
    expect(bieuDoB.get("1757")).toBe(bieuDoA.get("1757"));
  });

  // Hồi quy: 5750 (Du lịch) và 8630 (Bất động sản) băm vào cùng một tổ hợp màu.
  // Trước khi có bước dò, VJC và NVL đứng cạnh nhau cùng ra xanh y hệt.
  it("hai ngành đụng độ băm không được cùng màu", () => {
    const map = assignSectorColors(mk(["5750", "8630"]));
    expect(map.get("5750")).not.toBe(map.get("8630"));
  });

  it("ngành lớn hơn (đứng trước) giữ màu chuẩn, ngành nhỏ mới bị đẩy", () => {
    const map = assignSectorColors(mk(["5750", "8630"]));
    expect(map.get("5750")).toBe(colorForSector("5750", "N5750"));
    expect(map.get("8630")).not.toBe(colorForSector("8630", "N8630"));
  });

  it("icb_code lặp lại (nhiều mã cùng ngành) chỉ chiếm một màu", () => {
    const map = assignSectorColors(mk(["8770", "8770", "8770"]));
    expect(map.size).toBe(1);
  });

  it("colorForSector thuần theo icb_code", () => {
    expect(colorForSector("8355", "Ngân hàng")).toBe(colorForSector("8355", "Tên khác"));
    expect(buildPalette(false)).toContain(colorForSector("8355", "Ngân hàng"));
  });

  it("thiếu icb_code → xám như chưa phân loại", () => {
    expect(colorForSector("", "Ngành lạ")).toBe("#8a8a86");
  });

  it("Chưa phân loại luôn xám, không chiếm slot hue", () => {
    const items = [{ icb_code: "", name: UNCLASSIFIED }, ...mk(["8355"])];
    const map = assignSectorColors(items);
    expect(map.get(UNCLASSIFIED)).toBe("#8a8a86");
    expect(map.get("8355")).not.toBe("#8a8a86");
  });

  it("dark mode dùng bộ step riêng, không phải lật màu light", () => {
    const light = assignSectorColors(mk(["8355"]), false).get("8355");
    const dark = assignSectorColors(mk(["8355"]), true).get("8355");
    expect(dark).not.toBe(light);
  });

  it("danh sách rỗng → map rỗng", () => {
    expect(assignSectorColors([]).size).toBe(0);
  });
});

describe("labelInk", () => {
  it("nền vàng/nhạt → chữ đen, nền tím đậm → chữ trắng", () => {
    expect(labelInk("#eda100")).toBe("#0b0b0b");
    expect(labelInk("#4a3aa7")).toBe("#ffffff");
  });

  // Nhãn trong ô là chữ đậm 11–22px → ngưỡng WCAG áp dụng là 3:1 (chữ lớn).
  it("mọi màu palette đều đạt ≥ 3:1 và luôn chọn bên tương phản cao hơn", () => {
    for (const dark of [false, true]) {
      for (const bg of buildPalette(dark)) {
        const chosen = labelInk(bg);
        const other = chosen === "#ffffff" ? "#0b0b0b" : "#ffffff";
        expect(contrast(bg, chosen)).toBeGreaterThanOrEqual(3);
        expect(contrast(bg, chosen)).toBeGreaterThanOrEqual(contrast(bg, other));
      }
    }
  });
});

// Tương phản WCAG, tính lại độc lập với code để test không "tự chấm điểm mình".
function contrast(a, b) {
  const lum = (hex) => {
    const h = hex.replace("#", "");
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
