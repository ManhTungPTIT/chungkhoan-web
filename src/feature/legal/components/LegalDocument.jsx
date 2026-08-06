import { useLocation, useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

import "../styles/legal.scss";

/**
 * Khung chung cho một văn bản pháp lý. Nhận nội dung dạng dữ liệu (xem content/).
 *
 * Dùng cho cả web lẫn app: hai bản chỉ khác bề rộng dòng, xử lý trong SCSS.
 *
 * Không dùng lại `AccountScreen` của mục tài khoản làm khung: nút quay lại của nó đi thẳng
 * về `/info`, mà `/info` nằm sau PrivateRoute — người CHƯA đăng nhập mở trang này từ màn
 * đăng ký sẽ bị đá sang `/login`. Ở đây quay lại đúng chỗ vừa rời đi.
 */
export default function LegalDocument({ document }) {
  const navigate = useNavigate();
  const location = useLocation();

  // react-router đánh dấu mục lịch sử ĐẦU TIÊN là "default". Khác "default" nghĩa là có
  // chỗ để lùi về; bằng "default" nghĩa là người dùng mở thẳng URL (deep link, quét QR,
  // link từ Google Play) — lùi một bước sẽ ra khỏi ứng dụng.
  const goBack = () =>
    location.key === "default" ? navigate("/") : navigate(-1);

  return (
    <div className="legal">
      <header className="legal__bar">
        <button
          type="button"
          className="legal__back"
          onClick={goBack}
          aria-label="Quay lại"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <h1 className="legal__title">{document.title}</h1>
      </header>

      <article className="legal__body">
        <p className="legal__effective">
          Có hiệu lực từ ngày {document.effectiveDate}
        </p>
        <p className="legal__intro">{document.intro}</p>

        {document.sections.map((section) => (
          <section key={section.heading} className="legal__section">
            <h2 className="legal__heading">{section.heading}</h2>

            {section.paragraphs?.map((text) => (
              <p key={text} className="legal__para">
                {text}
              </p>
            ))}

            {section.items && (
              <ul className="legal__list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}

            {/* Câu chốt đứng SAU danh sách. Tách khỏi `paragraphs` (luôn đứng trước)
                vì thứ tự trong văn bản pháp lý là một phần của nghĩa. */}
            {section.notes?.map((text) => (
              <p key={text} className="legal__para">
                {text}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
