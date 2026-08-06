import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

import "../styles/infoUser.scss";
import "../styles/accountMenu.scss";

/**
 * Khung của một màn con trong hub tài khoản (bản APP): thanh đầu có nút quay lại + tiêu đề,
 * dưới là nội dung.
 *
 * Nút quay lại đi thẳng tới `/info` chứ không phải `navigate(-1)`: mở màn con bằng đường
 * dẫn trực tiếp (deep link, hoặc F5 khi đang ở đó) thì lịch sử rỗng, lùi một bước sẽ ra
 * khỏi app. Nút Back CỨNG của Android vẫn lùi lịch sử như thường — hai đường khác nhau,
 * cả hai đều dẫn về hub trong luồng dùng bình thường.
 */
export default function AccountScreen({ title, children }) {
  const navigate = useNavigate();

  return (
    <div className="acc-screen">
      <header className="acc-screen__bar">
        <button
          type="button"
          className="acc-screen__back"
          onClick={() => navigate("/info")}
          aria-label="Quay lại"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <h2 className="acc-screen__title">{title}</h2>
      </header>

      <div className="info-user acc-screen__body">{children}</div>
    </div>
  );
}
