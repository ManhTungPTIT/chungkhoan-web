// Tách thuần hàm khỏi axiosClient để test được: bản thân interceptor đụng
// window.location.href, gán vào đó trong jsdom không điều hướng mà cũng chẳng
// khẳng định được gì.
import { describe, expect, it } from "vitest";
import { loginRedirectPath } from "../loginRedirect";

describe("loginRedirectPath", () => {
  it("phiên bị đá → kèm lý do để màn login giải thích được", () => {
    expect(loginRedirectPath("/chart/market", "SESSION_SUPERSEDED")).toBe(
      "/login?reason=superseded",
    );
  });

  it("lỗi phiên thường → về login trơn, không doạ người dùng", () => {
    expect(loginRedirectPath("/chart/market", "INVALID_TOKEN")).toBe("/login");
  });

  it("không có mã lỗi → về login trơn", () => {
    expect(loginRedirectPath("/chart/market", undefined)).toBe("/login");
  });

  it("đang ở khu admin thì về màn login admin", () => {
    expect(loginRedirectPath("/admin/user", "INVALID_TOKEN")).toBe("/admin/login");
  });

  it("admin bị đá vẫn giữ đúng khu (dù BE hiện không đá admin)", () => {
    expect(loginRedirectPath("/admin/kyc", "SESSION_SUPERSEDED")).toBe(
      "/admin/login?reason=superseded",
    );
  });
});
