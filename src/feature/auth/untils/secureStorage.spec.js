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
  usesAndroidKeystore,
} from "./secureStorage";

describe("SecureStorage native bridge", () => {
  beforeEach(() => {
    capacitor.isNativePlatform.mockReturnValue(true);
    capacitor.getPlatform.mockReturnValue("android");
    nativePlugin.get.mockReset();
    nativePlugin.set.mockReset();
    nativePlugin.remove.mockReset();
  });

  it("uses the native plugin on Android", async () => {
    nativePlugin.get.mockResolvedValue({ value: "encrypted-at-rest-token" });

    expect(usesAndroidKeystore()).toBe(true);
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

  it("never writes a browser preview token to Web Storage", async () => {
    capacitor.isNativePlatform.mockReturnValue(false);

    await setSecureValue("preview-refresh", "ram-only");

    expect(nativePlugin.set).not.toHaveBeenCalled();
    expect(localStorage.getItem("preview-refresh")).toBeNull();
    expect(sessionStorage.getItem("preview-refresh")).toBeNull();
    expect(await getSecureValue("preview-refresh")).toBe("ram-only");
    await removeSecureValue("preview-refresh");
  });
});
