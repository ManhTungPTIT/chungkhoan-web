// Tên gói đang dùng hiển thị ở header (MainLayout). Regression: header từng đọc
// me?.titles (field không tồn tại — titles nằm trong packageRequest) nên luôn
// hiển thị "VIP " trống.
import { describe, expect, it } from "vitest";
import { activePackageTitle } from "../packageDisplay";

describe("activePackageTitle", () => {
  it("trả tên gói khi yêu cầu đã được duyệt", () => {
    const me = { packageRequest: { titles: "1 năm", days: 365, status: "approved" } };
    expect(activePackageTitle(me, null)).toBe("1 năm");
  });

  it("pending/rejected/chưa có gói → null (không phải gói đang dùng)", () => {
    expect(
      activePackageTitle({ packageRequest: { titles: "90 ngày", status: "pending" } }, null),
    ).toBeNull();
    expect(
      activePackageTitle({ packageRequest: { titles: "90 ngày", status: "rejected" } }, null),
    ).toBeNull();
    expect(activePackageTitle({ packageRequest: null }, null)).toBeNull();
  });

  it("API chưa về → fallback packageTitle đã lưu lúc login", () => {
    expect(activePackageTitle(null, { packageTitle: "90 ngày" })).toBe("90 ngày");
  });

  it("API đã về nhưng không có gói → KHÔNG fallback dữ liệu cũ", () => {
    expect(activePackageTitle({ packageRequest: null }, { packageTitle: "90 ngày" })).toBeNull();
  });

  it("không có nguồn nào → null", () => {
    expect(activePackageTitle(null, null)).toBeNull();
    expect(activePackageTitle(undefined, undefined)).toBeNull();
  });
});
