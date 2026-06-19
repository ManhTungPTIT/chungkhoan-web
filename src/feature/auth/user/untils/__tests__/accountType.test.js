import { describe, it, expect } from "vitest";
import { detectAccountType, buildAccountPayload } from "../accountType";

describe("detectAccountType", () => {
  it("nhận diện email hợp lệ", () => {
    expect(detectAccountType("user@example.com")).toBe("email");
    expect(detectAccountType("  a.b@sub.domain.vn  ")).toBe("email");
  });

  it("nhận diện số điện thoại VN 10 số bắt đầu bằng 0", () => {
    expect(detectAccountType("0987654321")).toBe("phone");
    expect(detectAccountType("  0123456789  ")).toBe("phone");
  });

  it("từ chối số điện thoại sai độ dài", () => {
    expect(detectAccountType("098765432")).toBe("invalid"); // 9 số
    expect(detectAccountType("01234567890")).toBe("invalid"); // 11 số
  });

  it("từ chối số không bắt đầu bằng 0", () => {
    expect(detectAccountType("9876543210")).toBe("invalid");
    expect(detectAccountType("+84987654321")).toBe("invalid");
  });

  it("từ chối chuỗi rỗng / khoảng trắng / null / undefined", () => {
    expect(detectAccountType("")).toBe("invalid");
    expect(detectAccountType("   ")).toBe("invalid");
    expect(detectAccountType(null)).toBe("invalid");
    expect(detectAccountType(undefined)).toBe("invalid");
  });

  it("từ chối chuỗi rác", () => {
    expect(detectAccountType("abc")).toBe("invalid");
    expect(detectAccountType("a@b")).toBe("invalid");
    expect(detectAccountType("098-765-4321")).toBe("invalid");
  });
});

describe("buildAccountPayload", () => {
  it("trả về { email } cho email, đã trim", () => {
    expect(buildAccountPayload("  user@example.com  ")).toEqual({
      email: "user@example.com",
    });
  });

  it("trả về { phoneNumber } cho số điện thoại, đã trim", () => {
    expect(buildAccountPayload("  0987654321  ")).toEqual({
      phoneNumber: "0987654321",
    });
  });

  it("trả về null cho giá trị không hợp lệ", () => {
    expect(buildAccountPayload("")).toBeNull();
    expect(buildAccountPayload("abc")).toBeNull();
    expect(buildAccountPayload(null)).toBeNull();
  });
});
