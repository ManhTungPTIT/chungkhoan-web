// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";

/**
 * ADX — Average Directional Index (Wilder). Đo SỨC MẠNH xu hướng (không nói
 * hướng): ADX cao = xu hướng mạnh, ADX thấp = đi ngang. Kèm 2 đường định hướng
 * +DI / -DI để biết phe nào đang thắng.
 *
 * Công thức (làm trơn kiểu Wilder, hệ số 1/period):
 *   TR   = max(H-L, |H-Cprev|, |L-Cprev|)
 *   +DM  = (H-Hprev) > (Lprev-L) && (H-Hprev) > 0 ? (H-Hprev) : 0
 *   -DM  = (Lprev-L) > (H-Hprev) && (Lprev-L) > 0 ? (Lprev-L) : 0
 *   +DI  = 100 * SmoothTR( +DM ) / SmoothTR( TR )
 *   -DI  = 100 * SmoothTR( -DM ) / SmoothTR( TR )
 *   DX   = 100 * |+DI - -DI| / (+DI + -DI)
 *   ADX  = trung bình trơn Wilder của DX qua `period` phiên
 *
 * Trả mảng thẳng hàng dataList; thiếu key (undefined) khi chưa đủ nến để không
 * crash render. Dùng high/low nếu có, không thì fallback close (hợp test tuyến).
 */
export function calcADXValues(dataList, period = 14) {
  const n = dataList.length;
  const result = dataList.map(() => ({}));
  if (n < 2 || period < 1) return result;

  // 1) TR, +DM, -DM cho từng nến (cần nến trước nên bắt đầu từ i=1).
  const tr = new Array(n).fill(0);
  const plusDM = new Array(n).fill(0);
  const minusDM = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const cur = dataList[i];
    const prev = dataList[i - 1];
    const high = cur.high ?? cur.close;
    const low = cur.low ?? cur.close;
    const prevHigh = prev.high ?? prev.close;
    const prevLow = prev.low ?? prev.close;
    const prevClose = prev.close;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
  }

  // 2) Làm trơn Wilder: giá trị đầu = TỔNG `period` phần tử đầu (i=1..period),
  //    sau đó S = S - S/period + giá_trị_mới. +DI/-DI/DX có từ i=period.
  let trS = 0;
  let plusS = 0;
  let minusS = 0;
  const dx = new Array(n).fill(null);
  for (let i = 1; i < n; i++) {
    if (i <= period) {
      trS += tr[i];
      plusS += plusDM[i];
      minusS += minusDM[i];
    } else {
      trS = trS - trS / period + tr[i];
      plusS = plusS - plusS / period + plusDM[i];
      minusS = minusS - minusS / period + minusDM[i];
    }
    if (i >= period) {
      const pdi = trS === 0 ? 0 : (100 * plusS) / trS;
      const mdi = trS === 0 ? 0 : (100 * minusS) / trS;
      const sum = pdi + mdi;
      dx[i] = sum === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / sum;
      result[i].pdi = pdi;
      result[i].mdi = mdi;
    }
  }

  // 3) ADX = trơn Wilder của DX: ADX đầu = trung bình `period` DX đầu tiên
  //    (i=period..2*period-1), sau đó ADX = (ADXprev*(period-1) + DX)/period.
  let adx = null;
  let count = 0;
  let dxSum = 0;
  for (let i = period; i < n; i++) {
    if (dx[i] == null) continue;
    if (adx == null) {
      dxSum += dx[i];
      count += 1;
      if (count === period) {
        adx = dxSum / period;
        result[i].adx = adx;
      }
    } else {
      adx = (adx * (period - 1) + dx[i]) / period;
      result[i].adx = adx;
    }
  }

  return result;
}

registerIndicator({
  name: "ADX",
  shortName: "ADX",
  precision: 2,
  calcParams: [14],
  minValue: 0,
  maxValue: 100,
  figures: [
    {
      key: "pdi",
      title: "+DI: ",
      type: "line",
      styles: () => ({ color: "#26A69A" }), // +DI xanh: phe mua
    },
    {
      key: "mdi",
      title: "-DI: ",
      type: "line",
      styles: () => ({ color: "#EF5350" }), // -DI đỏ: phe bán
    },
    {
      key: "adx",
      title: "ADX: ",
      type: "line",
      styles: () => ({ color: "#2962FF", size: 2 }), // ADX nổi bật: sức mạnh
    },
  ],
  calc: (dataList, { calcParams }) => calcADXValues(dataList, calcParams[0]),
});
