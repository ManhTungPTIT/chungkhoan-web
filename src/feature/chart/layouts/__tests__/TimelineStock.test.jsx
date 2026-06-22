import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TimelineStock from "../TimelineStock";

describe("TimelineStock", () => {
  it("hiển thị khung đang chọn trên nút", () => {
    render(<TimelineStock activeTimeline="1d" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /1d/ })).toBeTruthy();
  });

  it("chọn một khung gọi onSelect với token đúng", () => {
    const onSelect = vi.fn();
    render(<TimelineStock activeTimeline="1d" onSelect={onSelect} />);

    // mở dropdown
    fireEvent.click(screen.getByRole("button", { name: /1d/ }));
    // chọn "1 giờ" (token 1h)
    fireEvent.click(screen.getByText("1 giờ"));

    expect(onSelect).toHaveBeenCalledWith("1h");
  });
});
