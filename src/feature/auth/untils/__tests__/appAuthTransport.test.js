// Cách refresh token đi từ BE về client KHÁC NHAU giữa web và app:
//
//   web  → refresh token nằm trong cookie httpOnly, JS không thấy, không lưu gì
//   app  → BE trả trong body (vì WebView chạy cross-origin, cookie sameSite=lax
//          không được gửi), app phải tự cất và tự gửi lại
//
// Hai điều dễ sai nhất, mỗi điều một test:
//  1. Web lỡ lưu refresh token vào localStorage → tự hạ cấp bảo mật, mất đúng
//     cái lợi của httpOnly.
//  2. App không ghi đè token MỚI sau mỗi lần refresh → BE xoay vòng token và coi
//     token cũ dùng lại là bị đánh cắp, thu hồi TOÀN BỘ phiên của người dùng.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadFor(target) {
  vi.resetModules();
  vi.stubEnv("VITE_TARGET", target);
  const appClient = await import("../appClient");
  const tokenStorage = await import("../../admin/untils/tokenStorage");
  return { ...appClient, ...tokenStorage };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("nhận diện client", () => {
  it("build app → IS_APP true và có header X-Client", async () => {
    const { IS_APP, CLIENT_HEADERS } = await loadFor("app");

    expect(IS_APP).toBe(true);
    expect(CLIENT_HEADERS).toEqual({ "X-Client": "app" });
  });

  it("build web → IS_APP false và KHÔNG gửi header nào", async () => {
    const { IS_APP, CLIENT_HEADERS } = await loadFor("web");

    expect(IS_APP).toBe(false);
    expect(CLIENT_HEADERS).toEqual({});
  });
});

describe("dựng request refresh", () => {
  it("app: gửi token trong body kèm header X-Client", async () => {
    const { refreshRequestConfig } = await loadFor("app");

    expect(refreshRequestConfig("rt1")).toEqual({
      body: { refreshToken: "rt1" },
      headers: { "X-Client": "app" },
    });
  });

  it("web: body rỗng — token đi theo cookie, không nhét vào body", async () => {
    const { refreshRequestConfig } = await loadFor("web");

    expect(refreshRequestConfig("rt1")).toEqual({ body: null, headers: {} });
  });
});

describe("lưu refresh token", () => {
  it("app: setTokens cất refresh token để dùng cho lần refresh sau", async () => {
    const { setTokens, getRefreshToken } = await loadFor("app");

    setTokens({ accessToken: "at1", refreshToken: "rt1" });

    expect(getRefreshToken()).toBe("rt1");
  });

  it("web: KHÔNG lưu refresh token dù BE có trả về", async () => {
    const { setTokens, getRefreshToken } = await loadFor("web");

    setTokens({ accessToken: "at1", refreshToken: "rt1" });

    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(sessionStorage.getItem("refreshToken")).toBeNull();
  });

  it("app: token xoay vòng phải ghi đè bản cũ", async () => {
    const { setTokens, setRefreshToken, getRefreshToken } = await loadFor("app");
    setTokens({ accessToken: "at1", refreshToken: "rt1" });

    setRefreshToken("rt2");

    expect(getRefreshToken()).toBe("rt2");
  });

  it("app: remember=false thì token nằm ở sessionStorage, mất khi đóng app", async () => {
    const { setTokens, getRefreshToken } = await loadFor("app");

    setTokens({ accessToken: "at1", refreshToken: "rt1", remember: false });

    expect(sessionStorage.getItem("refreshToken")).toBe("rt1");
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(getRefreshToken()).toBe("rt1");
  });

  it("đăng xuất xoá sạch refresh token", async () => {
    const { setTokens, clearTokens, getRefreshToken } = await loadFor("app");
    setTokens({ accessToken: "at1", refreshToken: "rt1" });

    clearTokens();

    expect(getRefreshToken()).toBeNull();
  });
});
