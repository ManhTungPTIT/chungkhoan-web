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

// SMA trên mảng số thuần — out[j] ánh xạ tới values[period-1+j]
export function smaOf(values, period) {
  if (values.length < period) return [];
  let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
  const out = [sum / period];
  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    out.push(sum / period);
  }
  return out;
}

// SMA có gắn timestamp — result[j] ánh xạ tới candles[period-1+j]
export function calcSMA(candles, period) {
  return smaOf(
    candles.map((c) => c.close),
    period,
  ).map((value, j) => ({
    time: candles[period - 1 + j].time,
    value,
  }));
}

// WMA trọng số tuyến tính — out[j] ánh xạ tới values[period-1+j].
// Phiên gần nhất trọng số `period`, xa nhất trọng số 1; mẫu số là tổng trọng số
// period*(period+1)/2. Dùng cho biên độ (high-low) của BOT Dài hạn.
export function wmaOf(values, period) {
  if (values.length < period) return [];
  const denom = (period * (period + 1)) / 2;
  const out = [];
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let w = 0; w < period; w++) {
      sum += values[i - period + 1 + w] * (w + 1);
    }
    out.push(sum / denom);
  }
  return out;
}

// BOT Dài hạn (BOT TREND 2) — hằng số cứng, KHÔNG phơi ra IndicatorPicker.
const NW_WMA_PERIOD = 10;
const NW_K = 3;

// Giá xác định xu hướng: trung bình của chính cây nến đó. Trùng công thức
// "HA Close" nhưng KHÔNG đệ quy — không có HA open ở đây.
const hacOf = (bar) => (bar.open + bar.high + bar.low + bar.close) / 4;

/**
 * Ngưỡng động NW của BOT TREND 2 — xem spec 2026-08-15-bot-trend2-nw-design.md.
 *
 * Trả mảng THẲNG HÀNG với `bars` (`null` cho 9 nến warm-up), khác quy ước lệch
 * chỉ số của wmaOf/emaOf/smaOf ngay trên. Cố ý: `calc` của klinecharts đòi mảng
 * cùng độ dài dataList, giống calcBBValues trong bbSignalIndicator.js.
 *
 * Chỉ đọc open/high/low/close nên chạy được trên CẢ `candles` của FE lẫn
 * `dataList` của klinecharts — đừng thêm tham chiếu `time` vào đây.
 *
 * Trong xu hướng tăng NW chỉ đi ngang hoặc đi lên; xu hướng giảm thì ngược lại.
 * Đó là nguồn gốc tính bám xu hướng: rung lắc nhỏ không kéo ngưỡng đi theo.
 */
export function calcNwTrend(bars) {
  const out = new Array(bars.length).fill(null);
  const wma = wmaOf(
    bars.map((bar) => bar.high - bar.low),
    NW_WMA_PERIOD,
  );
  if (wma.length === 0) return out;

  const seed = NW_WMA_PERIOD - 1;
  let trend = "down";
  let nw = hacOf(bars[seed]) + NW_K * wma[0];
  out[seed] = { nw, trend };

  for (let i = seed + 1; i < bars.length; i++) {
    const hac = hacOf(bars[i]);
    const rev = NW_K * wma[i - seed];

    if (trend === "up") {
      // So sánh CHẶT: HAC == NW không lật trạng thái.
      if (hac < nw) {
        trend = "down";
        nw = hac + rev;
      } else {
        nw = Math.max(nw, hac - rev);
      }
    } else if (hac > nw) {
      trend = "up";
      nw = hac - rev;
    } else {
      nw = Math.min(nw, hac + rev);
    }

    out[i] = { nw, trend };
  }

  return out;
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

/**
 * Đưa mức "Chốt lãi / Cắt lỗ" của tín hiệu CUỐI CÙNG về MA của nến MỚI NHẤT.
 *
 * Con số trên thẻ phải trùng đường MA10/MA20 tại phiên hiện tại — đường MA chạy
 * tiếp mỗi phiên nên giữ MA của nến signal thì càng để lâu càng lệch khỏi đường
 * khách đang nhìn.
 *
 * Chỉ đụng tín hiệu cuối (= trạng thái hiện tại). Các tín hiệu cũ giữ nguyên MA
 * tại nến của chúng nên lịch sử vẫn đọc đúng.
 *
 * `maSeries` là mảng do `calcSMA` sinh ra; phần tử cuối luôn ứng với nến cuối.
 */
function refreshLastSignalTarget(signals, maSeries) {
  if (signals.length === 0 || maSeries.length === 0) return;
  signals[signals.length - 1].priceTarget = maSeries[maSeries.length - 1].value;
}

/**
 * Tự động tính tín hiệu mua/bán bằng máy trạng thái flat/long.
 *
 * Bắt đầu ở trạng thái flat (đang ngoài). Tại mỗi nến k (k >= 34, đủ dữ
 * liệu Signal của MACD):
 *   flat → BUY  khi  close > MA20  VÀ  MACD > Signal   → chuyển sang long
 *   long → SELL khi  close < MA20                       → chuyển sang flat
 *
 * Điều kiện vào/ra dùng giá ĐÓNG CỬA (close). Riêng `price` đính kèm để
 * HIỂN THỊ lấy đáy THÂN nến min(open, close) cho BUY và đỉnh thân
 * max(open, close) cho SELL — bỏ râu nến, không ảnh hưởng logic phát tín hiệu.
 *
 * Máy trạng thái đảm bảo tín hiệu xen kẽ buy → sell → buy, không bỏ sót
 * lệnh ra. Cần ít nhất 35 nến để vòng lặp chạy (k bắt đầu tại 34).
 *
 * Ánh xạ index (như calcSMA/calcMACD sản xuất):
 *   ma20[k-19].value     = SMA20 tại nến k
 *   macdLine[k-25].value = MACD tại nến k
 *   signal[k-33].value   = Signal tại nến k
 */
export function generateSignals(candles) {
  const ma20 = calcSMA(candles, 20);
  const { macdLine, signal } = calcMACD(candles);
  const signals = [];

  let inLong = false;

  for (let i = 34; i < candles.length; i++) {
    const closePrice = candles[i].close;
    const ma = ma20[i - 19].value;

    const macd = macdLine[i - 25].value;
    const sig = signal[i - 33].value;

    if (!inLong) {
      // Vào lệnh: giá trên MA20 VÀ MACD > Signal
      
      if (closePrice > ma && macd > sig) {
        signals.push({
          time: candles[i].time,
          date: toDateString(candles[i].time),
          type: "buy",
          // "Chốt lãi / Cắt lỗ" = MA20, không phải giá đóng cửa: MA20 là ngưỡng
          // thoát lệnh của bot này (nhánh else bên dưới: thủng MA20 là bán).
          // Đây là MA20 tại nến vào lệnh, dùng cho các tín hiệu ĐÃ QUA; riêng
          // tín hiệu cuối được kéo về MA20 phiên mới nhất — xem
          // refreshLastSignalTarget ở cuối hàm.
          priceTarget: ma,
          price: Math.min(candles[i].open, candles[i].close), // hiển thị: neo marker ở đáy THÂN nến (bỏ râu)
        });
        inLong = true;
      }
    } else if (closePrice < ma && macd < sig) {
      // Ra lệnh: giá thủng MA20
      signals.push({
        time: candles[i].time,
        date: toDateString(candles[i].time),
        type: "sell",
        // Đang đứng ngoài thì mức đáng theo dõi là ngưỡng VÀO LẠI: luật mua của
        // bot là close > MA20 nên vượt lên MA20 là bot báo mua trở lại. Cùng
        // chu kỳ, cùng cách làm mới như nhánh buy.
        priceTarget: ma,
        price: Math.max(candles[i].open, candles[i].close), // hiển thị: neo marker ở đỉnh THÂN nến (bỏ râu)
      });
      inLong = false;
    }
  }

  refreshLastSignalTarget(signals, ma20);
  return signals;
}

/**
 * Tín hiệu mua/bán theo cấu trúc price-action + Histogram MACD.
 *
 * Máy trạng thái flat/long giữ tín hiệu xen kẽ buy → sell → buy.
 *
 * Điểm MUA — nến hiện tại (i) phải đồng thời:
 *   - Đỉnh cao hơn đỉnh nến trước:          high[i]  > high[i-1]
 *   - Đáy cao hơn đáy nến trước:            low[i]   > low[i-1]
 *   - Là nến tăng (xanh):                   close[i] > open[i]
 *   - Đóng cửa vượt đỉnh nến trước:         close[i] > high[i-1]
 *   - Đóng cửa vượt đỉnh cả hai nến trước:  close[i] > high[i-2]
 *   - Histogram hiện tại > Histogram nến trước: hist[i] > hist[i-1]
 *
 * Điểm BÁN — nến hiện tại (i) phải:
 *   - Đỉnh thấp hơn đỉnh nến trước:         high[i]  < high[i-1]
 *   - Đáy thấp hơn đáy nến trước:           low[i]   < low[i-1]
 *   - Là nến giảm (đỏ):                     close[i] < open[i]
 *   - Đóng cửa thủng đáy cả hai nến trước:  close[i] < low[i-1] VÀ close[i] < low[i-2]
 *   - Histogram hiện tại < Histogram nến trước: hist[i] < hist[i-1]
 *
 * Ánh xạ index của histogram (như calcMACD sản xuất):
 *   histogram[k-33].value = Histogram tại nến k  (k >= 33)
 * Vòng lặp bắt đầu tại i = 34 để có sẵn nến i-2 và histogram i-1.
 */
export function generateSignalsT(candles) {
  const { histogram } = calcMACD(candles);
  // MA10 KHÔNG tham gia luật mua/bán của bot này (luật là cấu trúc nến +
  // histogram, xem `isBuy`/`isSell` bên dưới) — tính riêng chỉ để lấy mức
  // "Chốt lãi / Cắt lỗ". Khác với BOT Trend, nơi MA20 vừa là ngưỡng thoát lệnh
  // vừa là mức hiển thị.
  const ma10 = calcSMA(candles, 10);
  const signals = [];

  let inLong = false;

  for (let i = 34; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];

    const hist = histogram[i - 33].value;
    const histPrev = histogram[i - 34].value;

    if (!inLong) {
      // Điểm MUA: cấu trúc bứt phá đỉnh + histogram tăng
      const isBuy =
        cur.high > prev.high &&
        cur.low > prev.low &&
        cur.close > cur.open &&
        cur.close > prev.high &&
        cur.close > prev2.high &&
        hist > histPrev;

      if (isBuy) {
        signals.push({
          time: cur.time,
          date: toDateString(cur.time),
          type: "buy",
          // MA10 tại nến vào lệnh, dùng cho các tín hiệu ĐÃ QUA; tín hiệu cuối
          // được kéo về MA10 phiên mới nhất (refreshLastSignalTarget cuối hàm).
          // `calcSMA(c, 10)[j]` ứng với `candles[9 + j]` nên nến i tra ở `i - 9`;
          // vòng lặp bắt đầu từ 34 nên chỉ số luôn hợp lệ.
          priceTarget: ma10[i - 9].value,
          price: Math.min(cur.open, cur.close), // hiển thị: neo marker ở đáy THÂN nến (bỏ râu)
        });
        inLong = true;
      }
    } else {
      // Điểm BÁN: cấu trúc thủng đáy + histogram giảm
      const isSell =
        cur.high < prev.high &&
        cur.low < prev.low &&
        cur.close < cur.open &&
        cur.close < prev.low &&
        cur.close < prev2.low &&
        hist < histPrev;

      if (isSell) {
        signals.push({
          time: cur.time,
          date: toDateString(cur.time),
          type: "sell",
          // Mức theo dõi khi đứng ngoài, cùng chu kỳ và cùng cách làm mới như
          // nhánh buy. MA10 vẫn KHÔNG tham gia luật bán (luật là cấu trúc nến +
          // histogram ở `isSell` ngay trên), chỉ dùng để hiển thị.
          priceTarget: ma10[i - 9].value,
          price: Math.max(cur.open, cur.close), // hiển thị: neo marker ở đỉnh THÂN nến (bỏ râu)
        });
        inLong = false;
      }
    }
  }

  refreshLastSignalTarget(signals, ma10);
  return signals;
}

export function generateSignalsLong(candles) {
  const ma50 = calcSMA(candles, 50);
  const { macdLine, signal } = calcMACD(candles);
  const signals = [];

  let inLong = false;

  // Bắt đầu tại 49: MA50 cần đủ 50 nến (ma50[i-49] hợp lệ khi i>=49);
  // MACD signal chỉ cần i>=33 nên 49 đã bao trùm.
  for (let i = 49; i < candles.length; i++) {
    const closePrice = candles[i].close;
    const ma = ma50[i - 49].value;

    const macd = macdLine[i - 25].value;
    const sig = signal[i - 33].value;

    if (!inLong) {
      // Vào lệnh: giá trên MA50 VÀ MACD > Signal
      if (closePrice > ma && macd > sig) {
        signals.push({
          time: candles[i].time,
          date: toDateString(candles[i].time),
          type: "buy",
          // CỐ Ý giữ giá đóng cửa, không đổi sang MA50: Trend dùng MA20 và T+
          // dùng MA10 là yêu cầu riêng cho hai bot đó. Đừng "thống nhất" chỗ này
          // nếu không có yêu cầu mới.
          priceTarget: closePrice,
          price: Math.min(candles[i].open, candles[i].close), // hiển thị: neo marker ở đáy THÂN nến (bỏ râu)
        });
        inLong = true;
      }
    } else if (closePrice < ma && macd < sig) {
      // Ra lệnh: giá thủng MA50
      signals.push({
        time: candles[i].time,
        date: toDateString(candles[i].time),
        type: "sell",
        // Giữ đúng quy ước riêng của bot này: giá đóng cửa, KHÔNG phải MA50 —
        // giống hệt nhánh buy ở trên.
        priceTarget: closePrice,
        price: Math.max(candles[i].open, candles[i].close), // hiển thị: neo marker ở đỉnh THÂN nến (bỏ râu)
      });
      inLong = false;
    }
  }

  return signals;
}