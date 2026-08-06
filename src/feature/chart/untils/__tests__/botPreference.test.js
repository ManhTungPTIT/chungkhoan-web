import { describe, expect, it } from "vitest";

import {
  BOT_STORAGE_KEY,
  DEFAULT_BOT,
  isKnownBot,
  loadBot,
  saveBot,
} from "../botPreference";

/** Storage giả, đủ dùng cho hai hàm này. */
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    data,
  };
}

/** Storage ném lỗi ở MỌI thao tác — đúng cách localStorage cư xử ở chế độ riêng
 *  tư và trong iframe bị chặn cookie bên thứ ba. */
const brokenStorage = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("SecurityError");
  },
};

describe("isKnownBot", () => {
  it("nhận đúng ba bot đang có", () => {
    expect(isKnownBot("trend")).toBe(true);
    expect(isKnownBot("t")).toBe(true);
    expect(isKnownBot("long")).toBe(true);
  });

  it("từ chối giá trị lạ, rỗng và null", () => {
    expect(isKnownBot("scalping")).toBe(false);
    expect(isKnownBot("")).toBe(false);
    expect(isKnownBot(null)).toBe(false);
    expect(isKnownBot(undefined)).toBe(false);
  });

  // Không được rơi vào Object.prototype: "toString" là key có sẵn của mọi object.
  it("không nhận key kế thừa từ Object.prototype", () => {
    expect(isKnownBot("toString")).toBe(false);
    expect(isKnownBot("constructor")).toBe(false);
  });
});

describe("loadBot", () => {
  it("trả bot đã lưu", () => {
    expect(loadBot(fakeStorage({ [BOT_STORAGE_KEY]: "long" }))).toBe("long");
  });

  it("chưa lưu gì → trend", () => {
    expect(loadBot(fakeStorage())).toBe(DEFAULT_BOT);
    expect(DEFAULT_BOT).toBe("trend");
  });

  // Người dùng sửa tay localStorage, hoặc bot cũ đã gỡ khỏi SIGNAL_GENERATORS.
  it("giá trị lạ → trend chứ không trả nguyên xi", () => {
    expect(loadBot(fakeStorage({ [BOT_STORAGE_KEY]: "scalping" }))).toBe("trend");
  });

  it("storage ném lỗi → trend, không ném ra ngoài", () => {
    expect(() => loadBot(brokenStorage)).not.toThrow();
    expect(loadBot(brokenStorage)).toBe("trend");
  });
});

describe("saveBot", () => {
  it("ghi bot hợp lệ", () => {
    const storage = fakeStorage();
    saveBot("t", storage);
    expect(storage.data[BOT_STORAGE_KEY]).toBe("t");
  });

  // Bỏ qua chứ KHÔNG ghi đè bằng mặc định: một lần gọi nhầm không được xoá lựa
  // chọn thật mà người dùng đã đặt.
  it("giá trị lạ → không ghi gì, giữ nguyên bot cũ", () => {
    const storage = fakeStorage({ [BOT_STORAGE_KEY]: "long" });
    saveBot("scalping", storage);
    expect(storage.data[BOT_STORAGE_KEY]).toBe("long");
  });

  it("storage ném lỗi → không ném ra ngoài", () => {
    expect(() => saveBot("trend", brokenStorage)).not.toThrow();
  });
});
