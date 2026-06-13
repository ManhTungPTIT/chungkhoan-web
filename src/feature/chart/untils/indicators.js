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

// EMA có gắn timestamp — result[j] ánh xạ tới candles[period-1+j]
export function calcEMA(candles, period) {
  return emaOf(
    candles.map((c) => c.close),
    period,
  ).map((value, j) => ({
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

  if (ema26.length === 0) return { macdLine: [], signal: [], histogram: [] };

  const macdLine = ema26.map((e26, j) => ({
    time: candles[25 + j].time,
    value: ema12[j + 14] - e26,
  }));

  const sigValues = emaOf(
    macdLine.map((m) => m.value),
    9,
  );
  if (sigValues.length === 0) return { macdLine, signal: [], histogram: [] };

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

// RSI theo Wilder — result[j] ánh xạ tới candles[period + j]
export function calcRSI(candles, period) {
  if (candles.length <= period) return [];
  const closes = candles.map((c) => c.close);
  const rsiVal = (g, l) => (l === 0 ? 100 : 100 - 100 / (1 + g / l));

  let gain = 0,
    loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  const out = [{ time: candles[period].time, value: rsiVal(avgGain, avgLoss) }];
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out.push({ time: candles[i].time, value: rsiVal(avgGain, avgLoss) });
  }
  return out;
}

// Chuyển time của nến thành chuỗi ngày dễ đọc
// Hỗ trợ: UNIX giây (number), BusinessDay {year, month, day}, hoặc chuỗi sẵn có
function toDateString(time) {
  const pad = (n) => String(n).padStart(2, "0");
  if (typeof time === "number") {
    const d = new Date(time * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (typeof time === "object" && time !== null) {
    return `${time.year}-${pad(time.month)}-${pad(time.day)}`;
  }
  return String(time);
}

// Cửa sổ xác nhận: hai lần cắt (giá↔MA20 và MACD↔Signal) được coi là
// cùng một tín hiệu nếu xảy ra cách nhau tối đa SIGNAL_WINDOW nến.
const SIGNAL_WINDOW = 3;

/**
 * Tự động tính tín hiệu mua/bán theo nguyên tắc "đúng khoảnh khắc cắt":
 *
 * MUA : giá CẮT LÊN MA20  VÀ  MACD CẮT LÊN Signal  (trong cửa sổ SIGNAL_WINDOW nến)
 * BÁN : giá CẮT XUỐNG MA20 VÀ  MACD CẮT XUỐNG Signal (trong cửa sổ SIGNAL_WINDOW nến)
 *
 * Tín hiệu phát ra tại cây nến mà sự kiện cắt thứ hai hoàn tất.
 * Cần ít nhất 35 nến để có đủ dữ liệu.
 */
export function generateSignals(candles) {
  const ma20 = calcEMA(candles, 20);
  const { macdLine, signal } = calcMACD(candles);
  const signals = [];

  // Các hàm phát hiện sự kiện cắt tại nến k (chỉ hợp lệ khi k >= 34)
  const priceCrossUp = (k) =>
    candles[k - 1].close <= ma20[k - 20].value &&
    candles[k].close > ma20[k - 19].value;
  const priceCrossDown = (k) =>
    candles[k - 1].close >= ma20[k - 20].value &&
    candles[k].close < ma20[k - 19].value;
  const macdCrossUp = (k) =>
    macdLine[k - 26].value <= signal[k - 34].value &&
    macdLine[k - 25].value > signal[k - 33].value;
  const macdCrossDown = (k) =>
    macdLine[k - 26].value >= signal[k - 34].value &&
    macdLine[k - 25].value < signal[k - 33].value;

  // true nếu sự kiện fn xảy ra trong cửa sổ [i-SIGNAL_WINDOW, i]
  const inWindow = (fn, i) => {
    for (let k = Math.max(34, i - SIGNAL_WINDOW); k <= i; k++) {
      if (fn(k)) return true;
    }
    return false;
  };

  for (let i = 34; i < candles.length; i++) {
    // MUA: cả hai lần cắt LÊN nằm trong cửa sổ, phát tại nến hoàn tất cặp
    if (
      inWindow(priceCrossUp, i) &&
      inWindow(macdCrossUp, i) &&
      (priceCrossUp(i) || macdCrossUp(i))
    ) {
      signals.push({
        time: candles[i].time,
        date: toDateString(candles[i].time),
        type: "buy",
        price: candles[i].close,
      });
    }

    // BÁN: cả hai lần cắt XUỐNG nằm trong cửa sổ, phát tại nến hoàn tất cặp
    if (
      inWindow(priceCrossDown, i) &&
      inWindow(macdCrossDown, i) &&
      (priceCrossDown(i) || macdCrossDown(i))
    ) {
      signals.push({
        time: candles[i].time,
        date: toDateString(candles[i].time),
        type: "sell",
        price: candles[i].close,
      });
    }
  }

  return signals;
}
