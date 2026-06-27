import { fireEvent, render, screen } from "@testing-library/react";
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

    fireEvent.change(screen.getByRole("spinbutton", { name: "Tenkan" }), {
      target: { value: "7" },
    });
    expect(onSaveConfig).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(onSaveConfig).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /Ichimoku/i })).toBeNull();
  });

  it("applies draft changes only when the user saves", () => {
    const onSaveConfig = openEditor();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Tenkan" }), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    expect(onSaveConfig).toHaveBeenCalledWith(
      "ICHIMOKU",
      expect.objectContaining({ params: [7, 26, 52, 26] }),
    );
    expect(screen.queryByRole("dialog", { name: /Ichimoku/i })).toBeNull();
  });
});
