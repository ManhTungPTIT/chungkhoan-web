import { describe, it, expect, beforeEach } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useSelectedBot } from "../useSelectedBot";
import { BOT_STORAGE_KEY } from "../../untils/botPreference";

const wrapper = (initial) =>
  function Wrapper({ children }) {
    return createElement(MemoryRouter, { initialEntries: [initial] }, children);
  };

// Đọc cả bot lẫn URL hiện hành để kiểm việc đắp `?bot=`.
const probe = () => ({ bot: useSelectedBot(), search: useLocation().search });

describe("useSelectedBot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lấy bot từ URL khi có", () => {
    const { result } = renderHook(probe, { wrapper: wrapper("/chart/filter?bot=long") });
    expect(result.current.bot).toBe("long");
  });

  it("ghi nhớ bot lấy từ URL", async () => {
    renderHook(probe, { wrapper: wrapper("/chart/filter?bot=t") });
    await waitFor(() => expect(localStorage.getItem(BOT_STORAGE_KEY)).toBe("t"));
  });

  it("URL thiếu bot → lấy bot đã nhớ và đắp vào URL", async () => {
    localStorage.setItem(BOT_STORAGE_KEY, "long");
    const { result } = renderHook(probe, { wrapper: wrapper("/chart/filter") });

    expect(result.current.bot).toBe("long");
    await waitFor(() => expect(result.current.search).toContain("bot=long"));
  });

  it("chưa nhớ gì → trend", () => {
    const { result } = renderHook(probe, { wrapper: wrapper("/chart/filter") });
    expect(result.current.bot).toBe("trend");
  });

  it("bot lạ trên URL → trend, KHÔNG tin giá trị người dùng gõ tay", () => {
    const { result } = renderHook(probe, { wrapper: wrapper("/chart/filter?bot=hack") });
    expect(result.current.bot).toBe("trend");
  });

  it("giữ nguyên các query khác khi đắp bot", async () => {
    const { result } = renderHook(probe, {
      wrapper: wrapper("/chart/filter?nganh=8300"),
    });
    await waitFor(() => expect(result.current.search).toContain("nganh=8300"));
    expect(result.current.search).toContain("bot=trend");
  });
});
