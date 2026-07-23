import { describe, it, expect } from "vitest";
import {
  buildSectorFlowSeries,
  sessionLabel,
  stackOrder,
  MIN_LABEL_TY,
  MIN_LABEL_PCT,
} from "../sectorFlowSeries";

const payload = {
  sessions: [1784160000, 1784246400, 1784505600, 1784592000, 1784678400],
  totals: [19473e9, 11207e9, 19054e9, 14884e9, 22224e9],
  industries: [
    {
      name: "Ngân hàng",
      icb_code: "8355",
      values: [5532e9, 3229e9, 5593e9, 4188e9, 6970e9],
      pcts: [28.41, 28.81, 29.36, 28.14, 31.36],
      total: 25512e9,
    },
    {
      name: "Dịch vụ tài chính",
      icb_code: "8770",
      values: [4077e9, 1732e9, 3728e9, 2301e9, 3379e9],
      pcts: [20.93, 15.46, 19.56, 15.46, 15.21],
      total: 15217e9,
    },
  ],
};

describe("sessionLabel", () => {
  it("nhãn phiên có thứ và ngày/tháng", () => {
    expect(sessionLabel(1784678400)).toBe("T4 22/07");
    expect(sessionLabel(1784505600)).toBe("T2 20/07");
  });
});

describe("buildSectorFlowSeries", () => {
  it("nhãn trục X đúng 5 phiên theo thứ tự BE", () => {
    const out = buildSectorFlowSeries(payload);
    expect(out.labels).toEqual(["T5 16/07", "T6 17/07", "T2 20/07", "T3 21/07", "T4 22/07"]);
  });

  it("giữ nguyên thứ tự ngành của BE (tổng 5 phiên giảm dần)", () => {
    const out = buildSectorFlowSeries(payload);
    expect(out.industries.map((g) => g.name)).toEqual(["Ngân hàng", "Dịch vụ tài chính"]);
  });

  it("quy giá trị về tỷ, làm tròn nguyên", () => {
    const out = buildSectorFlowSeries(payload);
    expect(out.industries[0].tys).toEqual([5532, 3229, 5593, 4188, 6970]);
  });

  it("giữ nguyên pct của BE", () => {
    expect(buildSectorFlowSeries(payload).industries[0].pcts[4]).toBe(31.36);
  });

  it("hai ngành liền kề khác màu", () => {
    const out = buildSectorFlowSeries(payload);
    expect(out.industries[0].color).not.toBe(out.industries[1].color);
  });

  it("cùng một payload cho ra cùng màu ở cả hai chart", () => {
    const a = buildSectorFlowSeries(payload);
    const b = buildSectorFlowSeries(payload);
    expect(a.industries.map((g) => g.color)).toEqual(b.industries.map((g) => g.color));
  });

  it("hơn 32 ngành vẫn có màu, không rơi ra undefined", () => {
    const many = {
      sessions: [1784160000],
      industries: Array.from({ length: 40 }, (_, i) => ({
        name: `N${i}`,
        icb_code: String(i),
        values: [1e9],
        pcts: [2.5],
      })),
    };
    const out = buildSectorFlowSeries(many);
    expect(out.industries.every((g) => /^#[0-9a-f]{6}$/.test(g.color))).toBe(true);
  });

  it("ngành thiếu mảng values/pcts vẫn đủ số khúc, không NaN", () => {
    const out = buildSectorFlowSeries({
      sessions: [1, 2, 3],
      industries: [{ name: "X", icb_code: "1" }],
    });
    expect(out.industries[0].tys).toEqual([0, 0, 0]);
    expect(out.industries[0].pcts).toEqual([0, 0, 0]);
  });

  it("payload rỗng/rác → rỗng", () => {
    expect(buildSectorFlowSeries(null)).toEqual({ labels: [], industries: [] });
    expect(buildSectorFlowSeries({ sessions: [], industries: [] })).toEqual({
      labels: [],
      industries: [],
    });
  });
});

describe("stackOrder", () => {
  it("đảo thứ tự để ngành lớn nằm trên đỉnh stack", () => {
    const out = buildSectorFlowSeries(payload);
    expect(stackOrder(out.industries).map((g) => g.name)).toEqual([
      "Dịch vụ tài chính",
      "Ngân hàng",
    ]);
  });

  it("không sửa mảng gốc (chú giải vẫn đọc thứ tự lớn trước)", () => {
    const out = buildSectorFlowSeries(payload);
    stackOrder(out.industries);
    expect(out.industries[0].name).toBe("Ngân hàng");
  });
});

describe("ngưỡng nhãn", () => {
  it("khớp bản mẫu: 300 tỷ và 1.9%", () => {
    expect(MIN_LABEL_TY).toBe(300);
    expect(MIN_LABEL_PCT).toBe(1.9);
  });
});
