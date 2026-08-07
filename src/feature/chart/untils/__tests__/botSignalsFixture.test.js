import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateSignals,
  generateSignalsT,
  generateSignalsLong,
} from "../indicators";

/**
 * Bộ nến mẫu DÙNG CHUNG với pytest (tests/test_bot_signals.py) — spec
 * 2026-08-07-filter-bot-signals-design.md §4.
 *
 * Ba thuật toán bot nay tồn tại ở CẢ hai ngôn ngữ. Lệch một điều kiện là marker
 * trên biểu đồ và dòng trong bảng bộ lọc nói hai chuyện khác nhau về cùng một mã,
 * mà không có gì báo. File này khoá phía JS; test_bot_signals.py khoá phía Python;
 * cả hai so với CÙNG một kỳ vọng.
 *
 * Đổi thuật toán → phải sinh lại fixture và sửa cả hai phía cùng lúc. Đó là mục
 * đích, không phải phiền toái.
 */
// Neo theo cwd của vitest (= thư mục `chart/`), KHÔNG dùng import.meta.url:
// vitest transform module nên import.meta.url không còn là URL scheme file.
const FIXTURE = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "../docs/fixtures/bot-signals-candles.json"),
    "utf-8",
  ),
);

const shape = (signals) => signals.map((s) => ({ time: s.time, type: s.type }));

describe("ba thuật toán bot khớp bộ nến mẫu dùng chung với backend", () => {
  it.each([
    ["trend", generateSignals],
    ["t", generateSignalsT],
    ["long", generateSignalsLong],
  ])("%s", (bot, generate) => {
    expect(shape(generate(FIXTURE.candles))).toEqual(FIXTURE.expected[bot]);
  });

  it("fixture thật sự có tín hiệu để so — bộ nến im lặng thì test trên vô nghĩa", () => {
    for (const bot of ["trend", "t", "long"]) {
      const sigs = FIXTURE.expected[bot];
      expect(sigs.length).toBeGreaterThanOrEqual(4);
      expect(sigs.some((s) => s.type === "buy")).toBe(true);
      expect(sigs.some((s) => s.type === "sell")).toBe(true);
    }
  });
});
