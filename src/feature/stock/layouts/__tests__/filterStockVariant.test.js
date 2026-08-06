// Hai bản trang bộ lọc nay dùng CHUNG một cây thẻ, khác nhau đúng ba giá trị.
// Khoá cả ba lại: ai chỉnh chỗ chừa của bản web mà tay trượt sang bản app thì
// bản app tự dưng mất/thừa dòng mà không ai thấy (không có ảnh chụp nào chặn).
import { describe, expect, it } from "vitest";
import { VARIANT } from "../FilterStockPage";

describe("VARIANT", () => {
  it("chừa chỗ dưới bảng khác nhau — app còn dòng gợi ý + thanh tab dưới", () => {
    expect(VARIANT.app.reserve).toBe(132);
    expect(VARIANT.web.reserve).toBe(100);
  });

  it("class gốc tách hẳn hai file SCSS", () => {
    expect(VARIANT.app.root).toBe("filter-app");
    expect(VARIANT.web.root).toBe("filter-web");
  });

  it("gợi ý nói đúng thao tác của từng nền: app chạm, web bấm chuột", () => {
    expect(VARIANT.app.hint).toBe("Chạm vào dòng để xem chi tiết");
    expect(VARIANT.web.hint).toBe("Bấm vào dòng để xem chi tiết");
  });
});
