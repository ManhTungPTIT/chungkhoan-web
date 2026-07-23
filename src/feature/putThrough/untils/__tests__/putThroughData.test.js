import { describe, it, expect } from "vitest";
import { buildPutThrough, toEchartsData, fmtVolume } from "../putThroughData";
import { colorForSector } from "../../../../untils/sectorColors";

const rows = [
  {
    symbol: "VJC",
    exchange: "HOSE",
    value: 861e9,
    volume: 6_726_000,
    deal_count: 3,
    group: "Du lịch & Giải trí",
    icb_code: "5751",
  },
  {
    symbol: "HCM",
    exchange: "HOSE",
    value: 649e9,
    volume: 20_000_000,
    deal_count: 1,
    group: "Dịch vụ tài chính",
    icb_code: "8770",
  },
];

describe("buildPutThrough", () => {
  it("quy giá trị về tỷ đồng làm tròn nguyên cho nhãn", () => {
    const { items } = buildPutThrough(rows);
    expect(items.map((s) => s.ty)).toEqual([861, 649]);
  });

  it("diện tích ô giữ giá trị thô, không dùng số tỷ đã làm tròn", () => {
    const { items } = buildPutThrough([{ ...rows[0], value: 861_499_000_000 }]);
    expect(items[0].value).toBe(861_499_000_000);
    expect(items[0].ty).toBe(861);
  });

  it("sort giảm dần kể cả khi payload sai thứ tự", () => {
    const { items } = buildPutThrough([rows[1], rows[0]]);
    expect(items.map((s) => s.symbol)).toEqual(["VJC", "HCM"]);
  });

  it("tổng giá trị = tổng các mã", () => {
    expect(buildPutThrough(rows).total).toBe(861e9 + 649e9);
  });

  it("màu lấy theo ngành, khớp đúng bảng màu dùng chung", () => {
    const { items } = buildPutThrough(rows);
    expect(items[0].color).toBe(colorForSector("5751", "Du lịch & Giải trí", false));
    expect(["#ffffff", "#0b0b0b"]).toContain(items[0].ink);
  });

  it("dark mode dùng bậc màu riêng", () => {
    const light = buildPutThrough(rows, false).items[0].color;
    const dark = buildPutThrough(rows, true).items[0].color;
    expect(dark).not.toBe(light);
  });

  it("mã thiếu ngành → xám chưa phân loại", () => {
    const { items } = buildPutThrough([{ symbol: "ABC", value: 30e9 }]);
    expect(items[0].color).toBe("#8a8a86");
    expect(items[0].group).toBe("");
  });

  it("loại dòng thiếu symbol hoặc value <= 0", () => {
    const { items } = buildPutThrough([
      { symbol: "", value: 30e9 },
      { symbol: "AAA", value: 0 },
      { symbol: "BBB", value: -1 },
      { symbol: "CCC", value: 30e9 },
    ]);
    expect(items.map((s) => s.symbol)).toEqual(["CCC"]);
  });

  it("input rác không crash", () => {
    expect(buildPutThrough(null).items).toEqual([]);
    expect(buildPutThrough(undefined).total).toBe(0);
    expect(buildPutThrough([null, 7]).items).toEqual([]);
  });
});

describe("toEchartsData", () => {
  it("nhãn ghép 'MÃ <tỷ>' như bản mẫu, node phẳng không có children", () => {
    const data = toEchartsData(buildPutThrough(rows).items);
    expect(data[0]).toMatchObject({
      name: "VJC",
      value: 861e9,
      _label: "VJC 861",
      _deals: 3,
      _group: "Du lịch & Giải trí",
    });
    expect(data[0].children).toBeUndefined();
  });
});

describe("fmtVolume", () => {
  it("khối lượng có phân cách hàng nghìn", () => {
    expect(fmtVolume(6726000)).toBe((6726000).toLocaleString("vi-VN"));
  });
});
