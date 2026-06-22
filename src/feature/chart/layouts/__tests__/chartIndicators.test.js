import { describe, it, expect } from "vitest";
import { ALL_INDICATORS } from "../chart";

describe("ALL_INDICATORS (danh sách chỉ báo picker)", () => {
  const byName = (n) => ALL_INDICATORS.find((i) => i.name === n);

  it("có VOL ở pane phụ (Volume mặc định bật ở pane dưới)", () => {
    expect(byName("VOL")?.pane).toBe("sub");
  });

  it("có MCDX ở pane phụ (thêm tùy ý qua picker, không còn hardcode)", () => {
    expect(byName("MCDX")?.pane).toBe("sub");
  });

  it("có ICHIMOKU vẽ đè lên nến (candle_pane)", () => {
    expect(byName("ICHIMOKU")?.pane).toBe("candle_pane");
  });
});
