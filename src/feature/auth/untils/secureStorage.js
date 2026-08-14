import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeSecureStorage = registerPlugin("SecureStorage");
const memoryFallback = new Map();

// App preview chạy trong browser có VITE_TARGET=app nhưng không có native bridge.
// Chỉ Android native được phép ghi lâu dài; các nền tảng chưa có implementation
// dùng RAM để tuyệt đối không rơi ngược về localStorage plaintext.
const usesAndroidKeystore = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export async function getSecureValue(key) {
  if (!usesAndroidKeystore()) return memoryFallback.get(key) ?? null;
  const result = await NativeSecureStorage.get({ key });
  return typeof result?.value === "string" ? result.value : null;
}

export async function setSecureValue(key, value) {
  if (!usesAndroidKeystore()) {
    memoryFallback.set(key, value);
    return;
  }
  await NativeSecureStorage.set({ key, value });
}

export async function removeSecureValue(key) {
  memoryFallback.delete(key);
  if (usesAndroidKeystore()) await NativeSecureStorage.remove({ key });
}

export { usesAndroidKeystore };
