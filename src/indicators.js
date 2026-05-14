// EMA trên mảng số thuần — out[j] ánh xạ tới values[period-1+j]
export function emaOf(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out = [ema];
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

export function calcSMA(candles, period) {
  const result = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
    result.push({ time: candles[i].time, value: avg });
  }
  return result;
}

export function calcBB(candles, period = 20, stdDev = 2) {
  const upper = [], middle = [], lower = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance = slice.reduce((sum, c) => sum + (c.close - avg) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push({ time: candles[i].time, value: avg + stdDev * sd });
    middle.push({ time: candles[i].time, value: avg });
    lower.push({ time: candles[i].time, value: avg - stdDev * sd });
  }
  return { upper, middle, lower };
}

// EMA có gắn timestamp — result[j] ánh xạ tới candles[period-1+j]
export function calcEMA(candles, period) {
  return emaOf(candles.map((c) => c.close), period).map((value, j) => ({
    time: candles[period - 1 + j].time,
    value,
  }));
}

// MACD(12,26,9)
// macdLine[j] → candles[25+j]
// signal[j]   → candles[33+j]
export function calcMACD(candles) {
  const closes = candles.map((c) => c.close);
  const ema12 = emaOf(closes, 12);
  const ema26 = emaOf(closes, 26);

  if (ema26.length === 0)
    return { macdLine: [], signal: [], histogram: [] };

  const macdLine = ema26.map((e26, j) => ({
    time: candles[25 + j].time,
    value: ema12[j + 14] - e26,
  }));

  const sigValues = emaOf(macdLine.map((m) => m.value), 9);
  if (sigValues.length === 0)
    return { macdLine, signal: [], histogram: [] };

  const signal = [];
  const histogram = [];
  sigValues.forEach((sig, j) => {
    const ref = macdLine[8 + j];
    const hist = ref.value - sig;
    signal.push({ time: ref.time, value: sig });
    histogram.push({
      time: ref.time,
      value: hist,
      color: hist >= 0 ? "rgba(38,166,154,0.7)" : "rgba(239,83,80,0.7)",
    });
  });

  return { macdLine, signal, histogram };
}

/**
 * Tự động tính tín hiệu mua/bán theo công thức:
 *
 * MUA : close > MA20  VÀ  MACD cắt lên trên Signal
 * BÁN : close cắt xuống dưới MA20  VÀ  MACD cắt xuống dưới Signal
 *
 * Cần ít nhất 35 nến để có đủ dữ liệu.
 */
export function generateSignals(candles) {
  const ma20 = calcEMA(candles, 20);
  const { macdLine, signal } = calcMACD(candles);
  const signals = [];

  for (let i = 34; i < candles.length; i++) {
    const close     = candles[i].close;
    const closePrev = candles[i - 1].close;

    const ma20Cur  = ma20[i - 19].value;
    const ma20Prev = ma20[i - 20].value;

    const macdCur  = macdLine[i - 25].value;
    const macdPrev = macdLine[i - 26].value;

    const sigCur  = signal[i - 33].value;
    const sigPrev = signal[i - 34].value;

    // MUA: giá trên MA20 VÀ MACD cắt lên Signal
    if (close > ma20Cur && macdPrev <= sigPrev && macdCur > sigCur) {
      signals.push({ time: candles[i].time, type: "buy", price: close });
    }

    // BÁN: giá cắt xuống dưới MA20 VÀ MACD cắt xuống Signal
    if (
      closePrev >= ma20Prev &&
      close < ma20Cur &&
      macdPrev >= sigPrev &&
      macdCur < sigCur
    ) {
      signals.push({ time: candles[i].time, type: "sell", price: close });
    }
  }

  return signals;
}
