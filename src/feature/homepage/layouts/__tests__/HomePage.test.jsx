import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import HomePage from "../HomePage";

// HomePage gọi useTopVolumn (react-query) nên cần QueryClientProvider như app thật.
function renderWithClient(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const homePageScss = readFileSync(resolve(currentDir, "../../styles/homePage.scss"), "utf8");

const sampleData = {
  brand: {
    name: "TEST STOCK",
    tagline: "DATA FIRST",
  },
  title: "Bảng kiểm thử cung cầu",
  updatedAt: {
    time: "09:15",
    date: "01/01/2026",
  },
  balance: {
    title: "Cân bằng thử nghiệm",
    subtitle: "Tổng quan dữ liệu test",
    buy: { percent: 60, label: "Phe mua", value: "600", unit: "tỷ đồng" },
    sell: { percent: 40, label: "Phe bán", value: "400", unit: "tỷ đồng" },
    summary: [
      { label: "Chênh lệch", value: "+200", unit: "tỷ đồng", tone: "positive" },
      { label: "Tổng khớp", value: "1,000", unit: "tỷ đồng", tone: "neutral" },
    ],
  },
  flowMap: {
    title: "Dòng tiền thử nghiệm",
    legends: [
      { label: "Mã cầu cao", tone: "positive" },
      { label: "Mã cung cao", tone: "negative" },
    ],
    center: {
      label: "Tổng cung cầu",
      value: "1,000",
      unit: "tỷ đồng",
    },
    points: [
      { symbol: "AAA", value: "+10", tone: "positive", strength: "strong", angle: 0 },
      { symbol: "BBB", value: "-5", tone: "negative", strength: "weak", angle: 180 },
    ],
    influence: [
      {
        title: "Ảnh hưởng tích cực",
        tone: "positive",
        levels: [{ label: "Mạnh", count: 2 }],
      },
    ],
  },
  marketStats: [
    { label: "Mã tăng giá", value: "10", detail: "Chiếm 10%", tone: "positive", icon: "up" },
  ],
};

describe("HomePage", () => {
  it("renders market overview from provided data", () => {
    renderWithClient(<HomePage data={sampleData} />);

    expect(screen.getByText("TEST STOCK")).toBeInTheDocument();
    expect(screen.getByText("Bảng kiểm thử cung cầu")).toBeInTheDocument();
    expect(screen.getByText("09:15 | 01/01/2026")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô hình cân cung cầu")).toHaveClass("supply-balance__scene");
    expect(screen.getByText("Mã tăng giá")).toBeInTheDocument();
  });
  it("keeps the desktop shell constrained to the viewport", () => {
    expect(homePageScss).toContain("height: 100dvh;");
    expect(homePageScss).toContain("overflow: hidden;");
    expect(homePageScss).not.toContain("overflow: hidden auto;");
  });

  it("caps the flow-map radar to the available panel height", () => {
    expect(homePageScss).toContain("container-type: size;");
    expect(homePageScss).toContain("100cqh");
  });
});
