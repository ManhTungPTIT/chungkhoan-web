import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartSection, ChartVisibilityProvider } from "../ChartSection";

afterEach(cleanup);

describe("ChartSection", () => {
  it("được tích thì render section kèm id/class/aria-label, không dính style ẩn", () => {
    render(
      <ChartVisibilityProvider visible={{ heatmap: true }}>
        <ChartSection id="heatmap" className="panel" aria-label="Bản đồ nhiệt">
          <span>nội dung</span>
        </ChartSection>
      </ChartVisibilityProvider>,
    );

    const section = screen.getByLabelText("Bản đồ nhiệt");
    expect(section.id).toBe("heatmap");
    expect(section.className).toBe("panel");
    expect(section.style.display).toBe("");
    expect(screen.getByText("nội dung")).toBeTruthy();
  });

  it("bị bỏ tích thì ẩn bằng display:none nhưng VẪN mount — chart bên trong tiếp tục cập nhật dữ liệu", () => {
    const Chart = vi.fn(() => <span>biểu đồ</span>);

    const { container } = render(
      <ChartVisibilityProvider visible={{ heatmap: false }}>
        <ChartSection id="heatmap" className="panel" aria-label="Bản đồ nhiệt">
          <Chart />
        </ChartSection>
      </ChartVisibilityProvider>,
    );

    const section = container.querySelector("#heatmap");
    expect(section).toBeTruthy();
    // display:none → không chiếm chỗ trong lưới, khác hẳn visibility/opacity.
    expect(section.style.display).toBe("none");
    expect(section.getAttribute("aria-hidden")).toBe("true");
    expect(Chart).toHaveBeenCalled();
  });

  it("giữ nguyên style sẵn có khi ẩn", () => {
    const { container } = render(
      <ChartVisibilityProvider visible={{ heatmap: false }}>
        <ChartSection id="heatmap" style={{ minHeight: "10rem" }} />
      </ChartVisibilityProvider>,
    );

    const section = container.querySelector("#heatmap");
    expect(section.style.display).toBe("none");
    expect(section.style.minHeight).toBe("10rem");
  });

  it("id chưa có trong map, hoặc thiếu provider, thì mặc định hiện", () => {
    render(
      <>
        <ChartVisibilityProvider visible={{}}>
          <ChartSection id="chart-moi" aria-label="Biểu đồ mới" />
        </ChartVisibilityProvider>
        <ChartSection id="khong-provider" aria-label="Không provider" />
      </>,
    );

    expect(screen.getByLabelText("Biểu đồ mới").style.display).toBe("");
    expect(screen.getByLabelText("Không provider").style.display).toBe("");
  });
});
