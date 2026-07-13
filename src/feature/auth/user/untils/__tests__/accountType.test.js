import { describe, it, expect } from "vitest";
import { buildAccountPayload, detectAccountType } from "../accountType";

describe("buildAccountPayload", () => {
  it("map input có @ thành email (mặc định)", () => {
    expect(buildAccountPayload("a@b.com")).toEqual({ email: "a@b.com" });
  });

  it("map input không @ thành phoneNumber (mặc định)", () => {
    expect(buildAccountPayload("0912345678")).toEqual({
      phoneNumber: "0912345678",
    });
    expect(buildAccountPayload("myusername")).toEqual({
      phoneNumber: "myusername",
    });
  });

  it("rỗng → null", () => {
    expect(buildAccountPayload("   ")).toBeNull();
    expect(buildAccountPayload("")).toBeNull();
  });

  it("accountType VPS/TCBS → { broker, brokerAccount }", () => {
    expect(buildAccountPayload("123456", "VPS")).toEqual({
      broker: "VPS",
      brokerAccount: "123456",
    });
    expect(buildAccountPayload(" 6001234 ", "TCBS")).toEqual({
      broker: "TCBS",
      brokerAccount: "6001234",
    });
  });

  it("VPS/TCBS vẫn trả null khi rỗng", () => {
    expect(buildAccountPayload("  ", "VPS")).toBeNull();
  });
});

describe("detectAccountType (không đổi)", () => {
  it("email / phone / invalid", () => {
    expect(detectAccountType("a@b.com")).toBe("email");
    expect(detectAccountType("0912345678")).toBe("phone");
    expect(detectAccountType("xyz")).toBe("invalid");
  });
});
