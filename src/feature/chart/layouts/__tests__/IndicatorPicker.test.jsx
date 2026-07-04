import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IndicatorPicker from "../IndicatorPicker";
import { buildDefaultIndicatorConfigs } from "../../untils/indicatorSettings";

function openEditor(active = { ICHIMOKU: true }, onSaveConfig = vi.fn()) {
  render(
    <IndicatorPicker
      active={active}
      configs={buildDefaultIndicatorConfigs()}
      onToggle={vi.fn()}
      onSaveConfig={onSaveConfig}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Chỉ báo/i }));
  const name = Object.keys(active)[0];
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`Chỉnh ${name === "ICHIMOKU" ? "Ichimoku" : name}`, "i") }));
  return onSaveConfig;
}

describe("IndicatorPicker", () => {
  it("opens a three-tab editor for an active indicator", () => {
    openEditor();

    expect(screen.getByRole("dialog", { name: /Ichimoku/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Các đầu vào" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Định dạng" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Hiển thị" })).toBeTruthy();
  });

  it("shows the same five display scopes for every indicator", () => {
    openEditor({ VOL: true });
    fireEvent.click(screen.getByRole("tab", { name: "Hiển thị" }));

    expect(screen.getByText("Sóng nhỏ")).toBeTruthy();
    expect(screen.getByText("Giờ")).toBeTruthy();
    expect(screen.getByText("Ngày")).toBeTruthy();
    expect(screen.getByText("Tuần")).toBeTruthy();
    expect(screen.getByText("Tháng")).toBeTruthy();
  });

  it("does not apply draft changes when the user cancels", () => {
    const onSaveConfig = openEditor();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Khoảng thời gian quy đổi" }),
      { target: { value: "7" } },
    );
    expect(onSaveConfig).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onSaveConfig).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /Ichimoku/i })).toBeNull();
  });

  it("applies draft changes only when the user saves", () => {
    const onSaveConfig = openEditor();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Khoảng thời gian quy đổi" }),
      { target: { value: "7" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    expect(onSaveConfig).toHaveBeenCalledWith(
      "ICHIMOKU",
      expect.objectContaining({ params: [7, 26, 52, 26, 26] }),
    );
    expect(screen.queryByRole("dialog", { name: /Ichimoku/i })).toBeNull();
  });

  it("lets users add MA periods from a single input", () => {
    const onSaveConfig = openEditor({ MA: true });
    const dialog = screen.getByRole("dialog", { name: /MA/i });

    expect(within(dialog).queryByText("P1")).toBeNull();
    expect(within(dialog).getByText("MA5")).toBeTruthy();
    expect(within(dialog).getByText("MA10")).toBeTruthy();
    expect(within(dialog).getByText("MA20")).toBeTruthy();

    fireEvent.change(within(dialog).getByRole("spinbutton", { name: /MA/i }), {
      target: { value: "50" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Them MA" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /L/i }));

    expect(onSaveConfig).toHaveBeenCalledWith(
      "MA",
      expect.objectContaining({
        params: [5, 10, 20, 50],
        styles: expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({ label: "MA50" }),
          ]),
        }),
      }),
    );
  });

  it("opens a palette popover for line colors and saves palette edits", () => {
    const onSaveConfig = openEditor({ ICHIMOKU: true });
    const dialog = screen.getByRole("dialog", { name: /Ichimoku/i });

    fireEvent.click(within(dialog).getByRole("tab", { name: "Định dạng" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Tenkan bảng màu/i }),
    );

    expect(within(dialog).getByRole("grid", { name: /Bảng màu/i })).toBeTruthy();

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Chọn màu #F23645/i }),
    );
    fireEvent.change(within(dialog).getByRole("slider", { name: /Độ mờ/i }), {
      target: { value: "50" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Độ dày 3/i }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));

    expect(onSaveConfig).toHaveBeenCalledWith(
      "ICHIMOKU",
      expect.objectContaining({
        styles: expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({
              label: "Tenkan",
              color: "rgba(242, 54, 69, 0.5)",
              size: 3,
            }),
          ]),
        }),
      }),
    );
  });

  it("marks the editor as palette-open while a color popover is visible", () => {
    openEditor({ ICHIMOKU: true });
    const dialog = screen.getByRole("dialog", { name: /Ichimoku/i });

    fireEvent.click(within(dialog).getByRole("tab", { name: "Định dạng" }));
    expect(dialog).not.toHaveClass("indicator-editor--palette-open");

    fireEvent.click(
      within(dialog).getByRole("button", { name: /Tenkan bảng màu/i }),
    );

    expect(dialog).toHaveClass("indicator-editor--palette-open");
  });

  it("opens a line shape menu and saves the selected shape", () => {
    const onSaveConfig = openEditor({ ICHIMOKU: true });
    const dialog = screen.getByRole("dialog", { name: /Ichimoku/i });

    fireEvent.click(within(dialog).getByRole("tab", { name: "Định dạng" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Tenkan hình dạng/i }),
    );

    expect(
      within(dialog).getByRole("menu", { name: /Hình dạng đường/i }),
    ).toBeTruthy();

    fireEvent.click(
      within(dialog).getByRole("menuitemradio", {
        name: /Biểu đồ Đường bậc/i,
      }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));

    expect(onSaveConfig).toHaveBeenCalledWith(
      "ICHIMOKU",
      expect.objectContaining({
        styles: expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({
              label: "Tenkan",
              shape: "step",
              style: "solid",
            }),
          ]),
        }),
      }),
    );
  });
});
