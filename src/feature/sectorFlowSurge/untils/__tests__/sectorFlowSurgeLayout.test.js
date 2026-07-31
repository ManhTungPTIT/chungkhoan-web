import { describe, it, expect } from "vitest";
import { buildSectorFlowSurgeView } from "../sectorFlowSurgeLayout";

const row = (group, diem, pct_tang, extra = {}) => ({
  group,
  icb_code: group,
  gia_tri_khop_lenh: 100,
  duong_trung_binh: 50,
  pct_tang,
  diem,
  so_ma_tang: 3,
  so_ma_giam: 1,
  ...extra,
});

describe("buildSectorFlowSurgeView", () => {
  it("sắp theo điểm chứ không theo % đột biến", () => {
    const rows = [
      row("Ngành bé", 12, 900),   // spike to nhưng quy mô/độ rộng kém
      row("Ngành lớn", 80, 120),
    ];

    const view = buildSectorFlowSurgeView(rows);

    expect(view.rows.map((r) => r.group)).toEqual(["Ngành lớn", "Ngành bé"]);
    expect(view.rows[0].diem).toBe(80);
  });

  it("giữ số mã tăng/giảm cho phần hiển thị", () => {
    const view = buildSectorFlowSurgeView([row("A", 10, 50, { so_ma_tang: 7, so_ma_giam: 2 })]);

    expect(view.rows[0].soMaTang).toBe(7);
    expect(view.rows[0].soMaGiam).toBe(2);
  });

  it("bar % tách hai nửa quanh tâm, trục làm tròn bội số 5", () => {
    const view = buildSectorFlowSurgeView([row("UP", 5, 20), row("DOWN", -5, -10)]);

    expect(view.pctAxisMax).toBe(20);
    expect(view.rows[0].pctUpBarPct).toBe(100);
    expect(view.rows[0].pctDownBarPct).toBe(0);
    expect(view.rows[1].pctDownBarPct).toBe(50);
    expect(view.rows[1].pctUpBarPct).toBe(0);
  });

  it("rỗng / dữ liệu hỏng → 0, không NaN", () => {
    expect(buildSectorFlowSurgeView(null).rows).toEqual([]);

    const view = buildSectorFlowSurgeView([{ group: "X", icb_code: "X" }]);
    expect(view.rows[0].valueTy).toBe(0);
    expect(view.rows[0].diem).toBe(0);
    expect(view.rows[0].pctUpBarPct).toBe(0);
  });
});
