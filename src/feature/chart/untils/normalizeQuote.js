// Chuẩn hoá 1 quote thô (từ REST /quotes cũ hoặc WS /ws/quotes) về
// {price, time, volume?} — dùng chung bởi quoteStream.js (WS).
export function normalizeQuote(item, fallbackTime) {
  if (!item) return null;
  const price = Number(item.price);
  const rawTime = item.time ?? fallbackTime;
  const time =
    typeof rawTime === "number"
      ? rawTime
      : Math.floor(new Date(rawTime).getTime() / 1000);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(time))
    return null;

  const volume = Number(item.volume);
  return {
    price,
    time,
    ...(Number.isFinite(volume) ? { volume } : {}),
  };
}
