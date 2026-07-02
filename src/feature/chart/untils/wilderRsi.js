/**
 * RSI Wilder trên close, thẳng hàng dataList; null khi chưa đủ nến.
 * Giá trị đầu tiên tại index = period (trung bình cộng `period` chênh lệch
 * đầu), sau đó làm mượt Wilder: avg = (avg×(period−1) + hiện tại) / period.
 * Dùng chung cho chỉ báo RSI và MCDX.
 */
export function wilderRsiSeries(dataList, period) {
  const out = new Array(dataList.length).fill(null);
  if (period <= 0) return out;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < dataList.length; i++) {
    const diff = dataList[i].close - dataList[i - 1].close;
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
      if (i < period) continue;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const total = avgGain + avgLoss;
    out[i] = total === 0 ? 50 : (avgGain / total) * 100;
  }
  return out;
}
