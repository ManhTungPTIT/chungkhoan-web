import { beforeEach, describe, expect, it, vi } from "vitest";

const nativePlugin = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

const capacitor = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true),
  getPlatform: vi.fn(() => "android"),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: capacitor,
  registerPlugin: vi.fn(() => nativePlugin),
}));

import {
  getSecureValue,
  removeSecureValue,
  setSecureValue,
  usesNativeSecureStore,
} from "./secureStorage";

describe("SecureStorage native bridge", () => {
  beforeEach(() => {
    capacitor.isNativePlatform.mockReturnValue(true);
    capacitor.getPlatform.mockReturnValue("android");
    nativePlugin.get.mockReset();
    nativePlugin.set.mockReset();
    nativePlugin.remove.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("uses the native plugin on Android", async () => {
    nativePlugin.get.mockResolvedValue({ value: "encrypted-at-rest-token" });

    expect(usesNativeSecureStore()).toBe(true);
    expect(await getSecureValue("refreshToken")).toBe("encrypted-at-rest-token");
    expect(nativePlugin.get).toHaveBeenCalledWith({ key: "refreshToken" });

    await setSecureValue("refreshToken", "new-token");
    expect(nativePlugin.set).toHaveBeenCalledWith({
      key: "refreshToken",
      value: "new-token",
    });

    await removeSecureValue("refreshToken");
    expect(nativePlugin.remove).toHaveBeenCalledWith({ key: "refreshToken" });
  });

  it("uses the native plugin on iOS too", async () => {
    capacitor.getPlatform.mockReturnValue("ios");
    nativePlugin.get.mockResolvedValue({ value: "keychain-token" });

    expect(usesNativeSecureStore()).toBe(true);
    expect(await getSecureValue("refreshToken")).toBe("keychain-token");
    expect(nativePlugin.get).toHaveBeenCalledWith({ key: "refreshToken" });
  });

  it("treats an unknown native platform as having no secure store", () => {
    capacitor.getPlatform.mockReturnValue("electron");
    expect(usesNativeSecureStore()).toBe(false);
  });

  it("never writes a browser preview token to Web Storage", async () => {
    capacitor.isNativePlatform.mockReturnValue(false);

    await setSecureValue("preview-refresh", "ram-only");

    expect(nativePlugin.set).not.toHaveBeenCalled();
    expect(localStorage.getItem("preview-refresh")).toBeNull();
    expect(sessionStorage.getItem("preview-refresh")).toBeNull();
    expect(await getSecureValue("preview-refresh")).toBe("ram-only");
    await removeSecureValue("preview-refresh");
  });

  // ── Chính sách lỗi ────────────────────────────────────────────────────────────────
  // Bất đối xứng có chủ ý: ghi hỏng mà im lặng là nói dối người dùng — họ tưởng phiên đã
  // lưu. Đọc hỏng thì `null` đúng nghĩa "không có token", luồng auth sẵn có xử lý được.

  it("throws when the native store fails to write", async () => {
    nativePlugin.set.mockRejectedValue(new Error("KEYCHAIN_WRITE_FAILED"));

    await expect(setSecureValue("refreshToken", "token")).rejects.toThrow(
      "KEYCHAIN_WRITE_FAILED",
    );
  });

  it("returns null instead of throwing when the native store fails to read", async () => {
    nativePlugin.get.mockRejectedValue(new Error("KEYCHAIN_READ_FAILED"));

    expect(await getSecureValue("refreshToken")).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns null when the native store holds no value for the key", async () => {
    nativePlugin.get.mockResolvedValue({});

    expect(await getSecureValue("refreshToken")).toBeNull();
  });

  it("throws when the native store fails to delete", async () => {
    nativePlugin.remove.mockRejectedValue(new Error("KEYCHAIN_DELETE_FAILED"));

    await expect(removeSecureValue("refreshToken")).rejects.toThrow(
      "KEYCHAIN_DELETE_FAILED",
    );
  });

  it("drops the in-memory copy even when the native delete throws", async () => {
    // Thứ tự quan trọng: bản trong RAM phải biến mất trước, nếu không một lần xoá hỏng sẽ
    // để token sống tiếp trong tiến trình đang chạy.
    capacitor.isNativePlatform.mockReturnValue(false);
    await setSecureValue("refreshToken", "ram-only");

    capacitor.isNativePlatform.mockReturnValue(true);
    nativePlugin.remove.mockRejectedValue(new Error("KEYCHAIN_DELETE_FAILED"));
    await expect(removeSecureValue("refreshToken")).rejects.toThrow();

    capacitor.isNativePlatform.mockReturnValue(false);
    expect(await getSecureValue("refreshToken")).toBeNull();
  });
});
