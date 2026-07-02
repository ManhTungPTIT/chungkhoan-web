import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACTIVE_INDICATORS,
  buildDefaultIndicatorConfigs,
  getIndicatorLineDefinitions,
  normalizeIndicatorConfigs,
  serializeIndicatorState,
} from "../indicatorSettings";

describe("indicatorSettings", () => {
  it("builds default params for configurable indicators", () => {
    const configs = buildDefaultIndicatorConfigs();

    expect(configs.EMA.params).toEqual([10, 20]);
    expect(configs.MA.params).toEqual([5, 10, 20]);
    expect(configs.BOLL.params).toEqual([20, 2]);
  });

  it("builds MA line labels from the configured MA periods", () => {
    const configs = normalizeIndicatorConfigs({
      MA: { params: [5, 10, 20, 50] },
    });

    expect(getIndicatorLineDefinitions("MA")).toEqual([
      { label: "MA5" },
      { label: "MA10" },
      { label: "MA20" },
    ]);
    expect(configs.MA.styles.lines).toEqual([
      expect.objectContaining({ label: "MA5" }),
      expect.objectContaining({ label: "MA10" }),
      expect.objectContaining({ label: "MA20" }),
      expect.objectContaining({ label: "MA50" }),
    ]);
  });

  it("normalizes MA as a dynamic list of unique periods", () => {
    const configs = normalizeIndicatorConfigs({
      MA: { params: [20, "bad", 5, 20, 10, 0, 501] },
    });

    expect(configs.MA.params).toEqual([5, 10, 20]);
    expect(configs.MA.styles.lines.map((line) => line.label)).toEqual([
      "MA5",
      "MA10",
      "MA20",
    ]);
  });

  it("builds default style configs for indicator lines", () => {
    const configs = buildDefaultIndicatorConfigs();

    expect(configs.ICHIMOKU.styles.lines).toEqual([
      expect.objectContaining({ label: "Tenkan", visible: true }),
      expect.objectContaining({ label: "Kijun", visible: true }),
      expect.objectContaining({ label: "Span A", visible: true }),
      expect.objectContaining({ label: "Span B", visible: true }),
      expect.objectContaining({ label: "Chikou", visible: true }),
    ]);
  });

  it("builds the same display scopes for every indicator", () => {
    const configs = buildDefaultIndicatorConfigs();
    const expectedScopes = [
      { key: "small", label: "Sóng nhỏ", visible: true, min: 1, max: 59 },
      { key: "hour", label: "Giờ", visible: true, min: 1, max: 24 },
      { key: "day", label: "Ngày", visible: true, min: 1, max: 366 },
      { key: "week", label: "Tuần", visible: true, min: 1, max: 52 },
      { key: "month", label: "Tháng", visible: true, min: 1, max: 12 },
    ];

    expect(configs.ICHIMOKU.display.scopes).toEqual(expectedScopes);
    expect(configs.VOL.display.scopes).toEqual(expectedScopes);
  });

  it("keeps user params and falls back invalid values to defaults", () => {
    const configs = normalizeIndicatorConfigs({
      EMA: { params: [5, "bad"] },
      BOLL: { params: [0, 3] },
    });

    expect(configs.EMA.params).toEqual([5, 20]);
    expect(configs.BOLL.params).toEqual([20, 3]);
  });

  it("allows Ichimoku displacement to be adjusted down to zero", () => {
    const configs = normalizeIndicatorConfigs({
      ICHIMOKU: { params: [7, 22, 44, 0] },
    });

    // 5 tham số: Tenkan, Kijun, Span B, Lagging Span (=0), dịch mây (mặc định 26)
    expect(configs.ICHIMOKU.params).toEqual([7, 22, 44, 0, 26]);
  });

  it("discards saved MCDX params from an older schema (no matching paramsVersion)", () => {
    // Bản cũ lưu [Banker=50, Hot=21, Shark=10]; nếu pad theo vị trí, 21/10 sẽ
    // thành Baseline/Sensitivity → banker = (RSI−21)×10 kịch trần 20 mọi nến.
    const configs = normalizeIndicatorConfigs({
      MCDX: { params: [50, 21, 10] },
    });

    expect(configs.MCDX.params).toEqual([50, 50, 1.5, 40, 30, 0.7, 20, 10]);
  });

  it("keeps saved MCDX params carrying the current paramsVersion", () => {
    const configs = normalizeIndicatorConfigs({
      MCDX: {
        paramsVersion: 2,
        params: [60, 45, 2, 35, 25, 0.5, 15, 12],
      },
    });

    expect(configs.MCDX.params).toEqual([60, 45, 2, 35, 25, 0.5, 15, 12]);
    // Version phải được ghi lại vào config chuẩn hoá để lần lưu sau còn khớp.
    expect(configs.MCDX.paramsVersion).toBe(2);
  });

  it("allows MCDX sensitivity values below 1", () => {
    const configs = normalizeIndicatorConfigs({
      MCDX: {
        paramsVersion: 2,
        params: [50, 50, 0.5, 40, 30, 0.3, 20, 10],
      },
    });

    expect(configs.MCDX.params[2]).toBe(0.5);
    expect(configs.MCDX.params[5]).toBe(0.3);
  });

  it("discards saved line styles from an older schema (no matching paramsVersion)", () => {
    // Config RSI cũ có 3 dòng style P1/P2/P3; nếu ghép theo vị trí, màu xanh
    // của P1 sẽ đè lên đường RSI mới → phải bỏ cùng với params, về mặc định.
    const configs = normalizeIndicatorConfigs({
      RSI: {
        params: [6, 12, 24],
        styles: {
          lines: [
            { label: "P1", visible: true, color: "#2962FF", size: 1, style: "solid" },
            { label: "P2", visible: true, color: "#9C27B0", size: 1, style: "solid" },
            { label: "P3", visible: true, color: "#26A69A", size: 1, style: "solid" },
          ],
        },
      },
    });

    expect(configs.RSI.styles.lines).toEqual([
      expect.objectContaining({ label: "RSI", color: "#7E57C2" }),
    ]);
  });

  it("discards saved RSI params from the old three-period schema", () => {
    // Bản cũ dùng RSI built-in 3 chu kỳ [6,12,24]; bản mới là RSI Wilder 1 chu
    // kỳ 14 — pad theo vị trí sẽ thành RSI 6 nên phải bỏ, quay về mặc định.
    const configs = normalizeIndicatorConfigs({
      RSI: { params: [6, 12, 24] },
    });

    expect(configs.RSI.params).toEqual([14]);
  });

  it("serializes active indicators with normalized params", () => {
    const state = serializeIndicatorState(
      { ...DEFAULT_ACTIVE_INDICATORS, RSI: true },
      { RSI: { paramsVersion: 2, params: [21] } },
    );

    expect(state).toEqual({
      active: { EMA: true, VOL: true, RSI: true },
      configs: expect.objectContaining({
        RSI: expect.objectContaining({ params: [21] }),
      }),
    });
  });

  it("normalizes style and display edits while preserving safe user values", () => {
    const configs = normalizeIndicatorConfigs({
      EMA: {
        params: [5, 13],
        styles: {
          lines: [
            { visible: false, color: "#123456", size: 3, style: "dashed" },
            { visible: true, color: "bad", size: 99, style: "dots" },
          ],
        },
        display: {
          scopes: [
            { visible: false, min: 2, max: 88 },
            { visible: true, min: "bad", max: 1000 },
          ],
        },
      },
    });

    expect(configs.EMA.styles.lines[0]).toEqual({
      label: "Nhanh",
      visible: false,
      color: "#123456",
      size: 3,
      style: "dashed",
    });
    expect(configs.EMA.styles.lines[1]).toEqual(
      expect.objectContaining({ label: "Chậm", visible: true, size: 1 }),
    );
    expect(configs.EMA.display.scopes[0]).toEqual({
      key: "small",
      label: "Sóng nhỏ",
      visible: false,
      min: 2,
      max: 88,
    });
    expect(configs.EMA.display.scopes[1]).toEqual({
      key: "hour",
      label: "Giờ",
      visible: true,
      min: 1,
      max: 24,
    });
  });
});
