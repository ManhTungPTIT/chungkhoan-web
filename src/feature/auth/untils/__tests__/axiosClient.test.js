import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("axiosClient request interceptor", () => {
  it("attaches the bearer token when present", async () => {
    localStorage.setItem("accessToken", "acc-xyz");
    const { default: axiosClient } = await import("../axiosClient.js");
    const handler = axiosClient.interceptors.request.handlers[0].fulfilled;
    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer acc-xyz");
  });

  it("leaves headers untouched when no token", async () => {
    const { default: axiosClient } = await import("../axiosClient.js");
    const handler = axiosClient.interceptors.request.handlers[0].fulfilled;
    const config = handler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("is configured with credentials", async () => {
    const { default: axiosClient } = await import("../axiosClient.js");
    expect(axiosClient.defaults.withCredentials).toBe(true);
  });
});
