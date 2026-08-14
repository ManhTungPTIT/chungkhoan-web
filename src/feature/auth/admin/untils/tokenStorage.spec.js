import { beforeEach, describe, expect, it, vi } from "vitest";

const secureStorage = vi.hoisted(() => ({
  getSecureValue: vi.fn(),
  setSecureValue: vi.fn(),
  removeSecureValue: vi.fn(),
}));

vi.mock("../../untils/appClient", () => ({ IS_APP: true }));
vi.mock("../../untils/secureStorage", () => secureStorage);

async function loadTokenStorage() {
  vi.resetModules();
  return import("./tokenStorage");
}

describe("Android refresh-token storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    secureStorage.getSecureValue.mockReset().mockResolvedValue(null);
    secureStorage.setSecureValue.mockReset().mockResolvedValue(undefined);
    secureStorage.removeSecureValue.mockReset().mockResolvedValue(undefined);
  });

  it("migrates a legacy persistent refresh token into secure storage", async () => {
    localStorage.setItem("refreshToken", "legacy-refresh");
    const tokens = await loadTokenStorage();

    await tokens.initializeTokenStorage();

    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
    expect(secureStorage.setSecureValue).toHaveBeenCalledWith(
      "refreshToken",
      "legacy-refresh",
    );
    expect(await tokens.getRefreshToken()).toBe("legacy-refresh");
  });

  it("persists only the refresh token in secure storage when remember is enabled", async () => {
    const tokens = await loadTokenStorage();

    await tokens.setTokens({
      accessToken: "short-lived-access",
      refreshToken: "long-lived-refresh",
      user: { id: 7 },
      remember: true,
    });

    expect(localStorage.getItem("accessToken")).toBe("short-lived-access");
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
    expect(secureStorage.setSecureValue).toHaveBeenCalledWith(
      "refreshToken",
      "long-lived-refresh",
    );
  });

  it("keeps a non-remembered refresh token in memory only", async () => {
    const tokens = await loadTokenStorage();

    await tokens.setTokens({
      accessToken: "session-access",
      refreshToken: "memory-refresh",
      remember: false,
    });

    expect(sessionStorage.getItem("accessToken")).toBe("session-access");
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
    expect(secureStorage.removeSecureValue).toHaveBeenCalledWith("refreshToken");
    expect(await tokens.getRefreshToken()).toBe("memory-refresh");

    await tokens.setRefreshToken("rotated-refresh");
    expect(secureStorage.setSecureValue).not.toHaveBeenCalled();
    expect(secureStorage.removeSecureValue).toHaveBeenCalledTimes(2);
    expect(await tokens.getRefreshToken()).toBe("rotated-refresh");
  });

  it("fails closed when secure storage cannot be opened", async () => {
    localStorage.setItem("accessToken", "stale-access");
    localStorage.setItem("auth-storage", "stale-profile");
    secureStorage.getSecureValue.mockRejectedValue(new Error("keystore unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const tokens = await loadTokenStorage();

    await tokens.initializeTokenStorage();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("auth-storage")).toBeNull();
    expect(await tokens.getRefreshToken()).toBeNull();
    consoleError.mockRestore();
  });
});
