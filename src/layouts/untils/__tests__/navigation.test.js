import { describe, expect, it } from "vitest";

import { BOTS, activeTabKey, botTargetPath } from "../navigation";

describe("botTargetPath", () => {
  it("giữ mã đang xem khi đổi bot", () => {
    expect(botTargetPath("?symbol=HPG&bot=trend", "t")).toBe("/?symbol=HPG&bot=t");
  });

  it("không có mã trên URL thì chỉ đặt bot", () => {
    expect(botTargetPath("", "long")).toBe("/?bot=long");
    expect(botTargetPath("?bot=trend", "long")).toBe("/?bot=long");
  });

  it("bỏ tham số của trang khác thay vì mang sang '/'", () => {
    // Bấm chọn bot khi đang ở /chart/filter: tham số bộ lọc không có nghĩa ở "/".
    expect(botTargetPath("?industry=bank&page=2", "trend")).toBe("/?bot=trend");
  });

  it("giữ mã kể cả khi URL còn tham số lạ", () => {
    expect(botTargetPath("?page=3&symbol=VNM", "t")).toBe("/?symbol=VNM&bot=t");
  });

  it("sinh được đường dẫn cho cả ba bot", () => {
    expect(BOTS.map((bot) => botTargetPath("?symbol=SSI", bot.value))).toEqual([
      "/?symbol=SSI&bot=trend",
      "/?symbol=SSI&bot=t",
      "/?symbol=SSI&bot=long",
    ]);
  });
});

describe("activeTabKey", () => {
  it("trang chủ thuộc tab Bot", () => {
    expect(activeTabKey("/")).toBe("bot");
  });

  it("khớp từng tab còn lại", () => {
    expect(activeTabKey("/chart/filter")).toBe("filter");
    expect(activeTabKey("/chart/market")).toBe("market");
    expect(activeTabKey("/info")).toBe("account");
  });

  it("các trang con của biểu đồ thị trường vẫn sáng tab Biểu đồ", () => {
    expect(activeTabKey("/chart/market/detail")).toBe("market");
  });

  it("đường dẫn không thuộc tab nào thì không tô sáng gì", () => {
    expect(activeTabKey("/chart/heatmap")).toBe(null);
    expect(activeTabKey("/login")).toBe(null);
  });
});
