import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PrivacyPolicyPage from "../layouts/PrivacyPolicyPage";
import InvestmentDisclaimerPage from "../layouts/InvestmentDisclaimerPage";
import { PRIVACY_POLICY } from "../content/privacyPolicy";
import { INVESTMENT_DISCLAIMER } from "../content/investmentDisclaimer";

afterEach(cleanup);

// Dựng cây route thật để kiểm nút quay lại đi tới đâu, thay vì mock useNavigate: cái
// cần kiểm ở đây chính là "lùi lịch sử hay về trang chủ", không phải hàm nào được gọi.
function renderAt(entries, initialIndex) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/legal/disclaimer" element={<InvestmentDisclaimerPage />} />
        <Route path="/register" element={<p>MÀN ĐĂNG KÝ</p>} />
        <Route path="/" element={<p>TRANG CHỦ</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Chính sách quyền riêng tư", () => {
  it("hiện đủ mọi mục của văn bản kèm ngày hiệu lực", () => {
    const { container } = renderAt(["/legal/privacy"]);

    expect(
      screen.getByRole("heading", { level: 1, name: PRIVACY_POLICY.title }),
    ).toBeInTheDocument();
    // Tra theo class chứ không theo chữ: cụm "có hiệu lực từ ngày" còn xuất hiện trong
    // mục "Thay đổi chính sách" ở cuối văn bản.
    expect(container.querySelector(".legal__effective")).toHaveTextContent(
      PRIVACY_POLICY.effectiveDate,
    );

    for (const section of PRIVACY_POLICY.sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.heading }),
      ).toBeInTheDocument();
    }
  });

  // Đây là những câu Google Play soi và cũng là những câu dễ bị sửa thành sai nhất khi
  // ai đó chép nội dung mẫu từ nơi khác vào.
  it("nói đúng sự thật về việc không có công cụ phân tích của bên thứ ba", () => {
    renderAt(["/legal/privacy"]);
    expect(
      screen.getByText(/không tích hợp bất kỳ công cụ phân tích/i),
    ).toBeInTheDocument();
  });

  it("nói rõ xóa tài khoản là xóa mềm, định danh cũ không dùng lại được", () => {
    renderAt(["/legal/privacy"]);
    expect(screen.getByText(/KHÔNG dùng để đăng ký tài khoản mới được/)).toBeInTheDocument();
  });
});

describe("Miễn trừ đầu tư", () => {
  it("hiện đủ mọi mục của văn bản", () => {
    renderAt(["/legal/disclaimer"]);

    expect(
      screen.getByRole("heading", { level: 1, name: INVESTMENT_DISCLAIMER.title }),
    ).toBeInTheDocument();
    for (const section of INVESTMENT_DISCLAIMER.sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.heading }),
      ).toBeInTheDocument();
    }
  });

  it("khẳng định ứng dụng không đặt lệnh thay người dùng", () => {
    renderAt(["/legal/disclaimer"]);
    expect(screen.getByText(/không đặt lệnh thay bạn/i)).toBeInTheDocument();
  });
});

describe("Nút quay lại", () => {
  it("mở từ trong app → lùi đúng màn vừa rời đi", () => {
    renderAt(["/register", "/legal/privacy"], 1);

    fireEvent.click(screen.getByRole("button", { name: /quay lại/i }));
    expect(screen.getByText("MÀN ĐĂNG KÝ")).toBeInTheDocument();
  });

  // Deep link (Google Play, QR, link chia sẻ) không có lịch sử để lùi — lùi một bước là
  // ra khỏi ứng dụng.
  it("mở thẳng bằng URL → về trang chủ chứ không lùi ra ngoài", () => {
    renderAt(["/legal/privacy"]);

    fireEvent.click(screen.getByRole("button", { name: /quay lại/i }));
    expect(screen.getByText("TRANG CHỦ")).toBeInTheDocument();
  });
});

describe("Thứ tự khối trong một mục", () => {
  // `paragraphs` luôn đứng trước danh sách, `notes` luôn đứng sau. Trong văn bản pháp lý
  // thứ tự là một phần của nghĩa: câu chốt "chúng tôi không bán dữ liệu" phải nằm SAU
  // danh sách mục đích sử dụng, không phải trước.
  it("câu chốt nằm sau danh sách", () => {
    const { container } = renderAt(["/legal/privacy"]);

    const purpose = [...container.querySelectorAll(".legal__section")].find((el) =>
      el.textContent.includes("Mục đích sử dụng dữ liệu"),
    );
    const list = purpose.querySelector(".legal__list");
    const note = purpose.querySelector(".legal__para");

    expect(note.textContent).toMatch(/không bán dữ liệu/i);
    // compareDocumentPosition: bit 4 = "đứng sau" theo thứ tự tài liệu.
    expect(list.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
