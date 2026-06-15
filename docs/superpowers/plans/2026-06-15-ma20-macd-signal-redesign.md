# MA20/MACD Signal Logic Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `generateSignals` as a `flat`/`long` state machine so every drop below MA20 emits a sell signal, fixing missed "Đỏ ra" signals on symbols like CLL.

**Architecture:** Replace the fragile "two crossovers must coincide within a 3-candle window" rule with a sequential state machine. Enter `long` (BUY) when `close > MA20 AND MACD > Signal`; exit to `flat` (SELL) when `close < MA20`. Reuse existing `calcEMA` and `calcMACD` helpers; output shape is unchanged so no consumer needs editing.

**Tech Stack:** JavaScript (ES modules), Vitest test runner (`npm test`).

**Reference spec:** `docs/superpowers/specs/2026-06-15-ma20-macd-signal-redesign-design.md`

---

## File Structure

- **Modify:** `src/feature/chart/untils/indicators.js` — rewrite `generateSignals`; delete `SIGNAL_WINDOW`, `inWindow`, and the four cross-detection helpers. `emaOf`, `calcEMA`, `calcMACD`, `calcRSI`, `toDateString` stay untouched.
- **Create:** `src/feature/chart/untils/__tests__/indicators.test.js` — unit tests for the new `generateSignals` behavior. (New `__tests__` folder under `untils/`, mirroring `klinecharts/__tests__/`.)

The change is contained in one source file plus its test. No consumer edits: `index.jsx`, the panel, and the chart marker overlay all read the unchanged `{ time, date, type, price }` shape.

---

### Task 1: Write the failing tests for the new state-machine behavior

**Files:**
- Create: `src/feature/chart/untils/__tests__/indicators.test.js`

The tests assert the new rules. Several will FAIL against the current implementation (which can emit a `sell` at a candle whose `close ≥ MA20`, and can miss the sell entirely) — that is expected and is the point of writing them first.

- [ ] **Step 1: Write the test file**

```javascript
import { describe, it, expect } from "vitest";
import { generateSignals, calcEMA, calcMACD } from "../indicators";

// generateSignals chỉ dùng `time` và `close`. Helper dựng nến tối thiểu.
const mk = (closes, startTime = 1700000000, stepSec = 86400) =>
  closes.map((close, i) => ({
    time: startTime + i * stepSec,
    open: close,
    high: close + 2,
    low: close - 2,
    close,
  }));

// Chuỗi dao động mạnh, 300 nến — sinh nhiều lần vào/ra để kiểm bất biến.
const oscillating = mk(
  Array.from(
    { length: 300 },
    (_, i) => 100 + Math.sin(i / 15) * 20 + Math.sin(i / 5) * 6 + (i % 3),
  ),
);

describe("generateSignals", () => {
  it("trả về mảng rỗng khi chưa đủ 35 nến", () => {
    const candles = mk(Array.from({ length: 30 }, (_, i) => 100 + i));
    expect(generateSignals(candles)).toEqual([]);
  });

  it("tín hiệu luôn xen kẽ và lệnh đầu tiên là buy", () => {
    const signals = generateSignals(oscillating);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].type).toBe("buy");
    for (let i = 1; i < signals.length; i++) {
      expect(signals[i].type).not.toBe(signals[i - 1].type);
    }
  });

  it("mỗi tín hiệu thỏa đúng luật trạng thái tại nến của nó", () => {
    const signals = generateSignals(oscillating);

    // Dựng map time -> giá trị MA20 / MACD / Signal bằng chính helper sản xuất.
    const maMap = new Map(calcEMA(oscillating, 20).map((p) => [p.time, p.value]));
    const { macdLine, signal } = calcMACD(oscillating);
    const macdMap = new Map(macdLine.map((p) => [p.time, p.value]));
    const sigMap = new Map(signal.map((p) => [p.time, p.value]));

    for (const s of signals) {
      const ma = maMap.get(s.time);
      if (s.type === "buy") {
        // Vào: giá trên MA20 VÀ MACD > Signal
        expect(s.price).toBeGreaterThan(ma);
        expect(macdMap.get(s.time)).toBeGreaterThan(sigMap.get(s.time));
      } else {
        // Ra: giá thủng MA20
        expect(s.price).toBeLessThan(ma);
      }
    }
  });

  it("đang giữ lệnh, giá thủng MA20 thì phát sell (uptrend rồi sập)", () => {
    // 35 nến đi ngang ~100 (warmup, không tín hiệu),
    // 25 nến tăng đều -> buy, rồi 20 nến rơi mạnh -> sell.
    const closes = [
      ...Array.from({ length: 35 }, () => 100),
      ...Array.from({ length: 25 }, (_, i) => 100 + (i + 1) * 3),
      ...Array.from({ length: 20 }, (_, i) => 172 - (i + 1) * 6),
    ];
    const signals = generateSignals(mk(closes));
    const types = signals.map((s) => s.type);

    expect(types).toContain("buy");
    expect(types).toContain("sell");
    // Có một sell xuất hiện sau buy đầu tiên
    expect(types.indexOf("sell")).toBeGreaterThan(types.indexOf("buy"));
    // Kết thúc bằng sell (đã thoát sau cú sập)
    expect(types[types.length - 1]).toBe("sell");
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail against the current implementation**

Run: `npm test -- src/feature/chart/untils/__tests__/indicators.test.js`
Expected: the suite runs; at least the "mỗi tín hiệu thỏa đúng luật" and "uptrend rồi sập" tests FAIL (current code can emit a sell where `close ≥ MA20` and can miss the sell). Confirms the tests exercise the new behavior.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/feature/chart/untils/__tests__/indicators.test.js
git commit -m "test: state-machine signal rules for generateSignals (red)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Rewrite `generateSignals` as a flat/long state machine

**Files:**
- Modify: `src/feature/chart/untils/indicators.js` (the `SIGNAL_WINDOW` constant through the end of `generateSignals` — current lines ~102–173)

- [ ] **Step 1: Replace the signal block**

Delete the `SIGNAL_WINDOW` constant, the JSDoc above the old `generateSignals`, the four cross helpers (`priceCrossUp`, `priceCrossDown`, `macdCrossUp`, `macdCrossDown`), the `inWindow` helper, and the old `for` loop. Replace everything from the `// Cửa sổ xác nhận:` comment through the end of `generateSignals` with:

```javascript
/**
 * Tự động tính tín hiệu mua/bán bằng máy trạng thái flat/long.
 *
 * Bắt đầu ở trạng thái flat (đang ngoài). Tại mỗi nến k (k >= 34, đủ dữ
 * liệu Signal của MACD):
 *   flat → BUY  khi  close > MA20  VÀ  MACD > Signal   → chuyển sang long
 *   long → SELL khi  close < MA20                       → chuyển sang flat
 *
 * Máy trạng thái đảm bảo tín hiệu xen kẽ buy → sell → buy, không bỏ sót
 * lệnh ra. Cần ít nhất 35 nến để vòng lặp chạy (k bắt đầu tại 34).
 *
 * Ánh xạ index (như calcEMA/calcMACD sản xuất):
 *   ma20[k-19].value     = MA20 tại nến k
 *   macdLine[k-25].value = MACD tại nến k
 *   signal[k-33].value   = Signal tại nến k
 */
export function generateSignals(candles) {
  const ma20 = calcEMA(candles, 20);
  const { macdLine, signal } = calcMACD(candles);
  const signals = [];

  let inLong = false;

  for (let i = 34; i < candles.length; i++) {
    const closePrice = candles[i].close;
    const ma = ma20[i - 19].value;

    if (!inLong) {
      // Vào lệnh: giá trên MA20 VÀ MACD > Signal
      const macd = macdLine[i - 25].value;
      const sig = signal[i - 33].value;
      if (closePrice > ma && macd > sig) {
        signals.push({
          time: candles[i].time,
          date: toDateString(candles[i].time),
          type: "buy",
          price: closePrice,
        });
        inLong = true;
      }
    } else if (closePrice < ma) {
      // Ra lệnh: giá thủng MA20
      signals.push({
        time: candles[i].time,
        date: toDateString(candles[i].time),
        type: "sell",
        price: closePrice,
      });
      inLong = false;
    }
  }

  return signals;
}
```

- [ ] **Step 2: Run the new test file and verify it passes**

Run: `npm test -- src/feature/chart/untils/__tests__/indicators.test.js`
Expected: PASS (all 4 tests green).

- [ ] **Step 3: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: PASS — `indicators.test.js`, `mcdxIndicator.test.js`, `bbSignalIndicator.test.js`, and `useIntraday.test.js` all green.

- [ ] **Step 4: Lint the changed file**

Run: `npm run lint`
Expected: no new errors for `src/feature/chart/untils/indicators.js` (no leftover unused helpers/constants).

- [ ] **Step 5: Commit**

```bash
git add src/feature/chart/untils/indicators.js
git commit -m "fix: state-machine buy/sell signals; sell on MA20 break

Replaces dual-cross-within-window rule that missed sell signals on
low-volatility symbols (e.g. CLL). Enter long when close>MA20 and
MACD>Signal; exit when close<MA20. Guarantees alternating signals.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §3 entry rule (`close>MA20 AND MACD>Signal`) → Task 2 Step 1, verified by Task 1 "mỗi tín hiệu thỏa đúng luật" + "uptrend rồi sập".
- §3 exit rule (`close<MA20`) → Task 2 Step 1, verified by Task 1 property + uptrend-crash tests.
- §3 guaranteed alternation → Task 1 "tín hiệu luôn xen kẽ".
- §4 ≥34 candles / loop from k=34 → Task 2 Step 1; min-length guard → Task 1 "mảng rỗng khi chưa đủ 35 nến".
- §5 deletions (`SIGNAL_WINDOW`, `inWindow`, 4 cross helpers) → Task 2 Step 1 + lint check Step 4.
- §6 unchanged output shape `{time,date,type,price}` → Task 2 Step 1 (same fields); consumers untouched.
- §7 test cases 1–5 → mapped to the 4 tests in Task 1 (case 3 = uptrend-crash sell; case 4 = property test rejects buy when MACD≤Signal; case 5 = empty-on-short).

**Placeholder scan:** none — all steps contain runnable code and exact commands.

**Type consistency:** `generateSignals`, `calcEMA`, `calcMACD` names and the `{time, value}` / `{time, date, type, price}` shapes are consistent across plan and existing code.
