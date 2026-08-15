import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeSecureStorage = registerPlugin("SecureStorage");
const memoryFallback = new Map();

// App preview chạy trong browser có VITE_TARGET=app nhưng không có native bridge.
// Chỉ Android (Keystore) và iOS (Keychain) mới ghi lâu dài được; các nền tảng chưa có
// implementation dùng RAM để tuyệt đối không rơi ngược về localStorage plaintext.
//
// `memoryFallback` KHÔNG phải cơ chế dự phòng khi native lỗi — native lỗi thì xem phần
// chính sách lỗi bên dưới. Nó chỉ phục vụ bản xem trước trong trình duyệt.
const NATIVE_PLATFORMS = ["android", "ios"];

const usesNativeSecureStore = () =>
  Capacitor.isNativePlatform() && NATIVE_PLATFORMS.includes(Capacitor.getPlatform());

// Chính sách lỗi cố ý BẤT ĐỐI XỨNG giữa đọc và ghi:
//
//   ghi hỏng  → NÉM. Nuốt lỗi là nói dối người dùng — họ tưởng phiên đã lưu, hôm sau mở
//               app thì mất, mà không có gì chỉ ra chuyện gì đã xảy ra.
//   đọc hỏng  → trả null. `null` ĐÚNG NGHĨA "không có token", và luồng auth sẵn có đã coi
//               đó là chưa đăng nhập. Ném ở đây bắt mọi nơi gọi phải bọc try/catch cho một
//               trạng thái vốn bình thường (mở app lần đầu, vừa đăng xuất).
//
// Tầng này KHÔNG phân nhánh theo mã lỗi, chỉ theo ném hay không ném. Nhờ vậy hai bản
// native giữ được mã lỗi riêng mà không phải đồng bộ với nhau.

export async function getSecureValue(key) {
  if (!usesNativeSecureStore()) return memoryFallback.get(key) ?? null;

  try {
    const result = await NativeSecureStorage.get({ key });
    return typeof result?.value === "string" ? result.value : null;
  } catch (error) {
    console.error(`Không đọc được "${key}" từ kho bảo mật của thiết bị.`, error);
    return null;
  }
}

export async function setSecureValue(key, value) {
  if (!usesNativeSecureStore()) {
    memoryFallback.set(key, value);
    return;
  }
  await NativeSecureStorage.set({ key, value });
}

export async function removeSecureValue(key) {
  // Xoá bản RAM TRƯỚC rồi mới gọi native: một lần xoá hỏng ở dưới không được phép để token
  // sống tiếp trong tiến trình đang chạy.
  memoryFallback.delete(key);
  if (usesNativeSecureStore()) await NativeSecureStorage.remove({ key });
}

export { usesNativeSecureStore };
