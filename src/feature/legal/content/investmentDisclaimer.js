import { CONTACT_EMAIL, EFFECTIVE_DATE, OPERATOR_NAME } from "../untils/legalInfo";

/**
 * Miễn trừ trách nhiệm đầu tư — cùng dạng dữ liệu với privacyPolicy.js.
 *
 * Điểm phải giữ đúng: ứng dụng KHÔNG nhận tiền, KHÔNG giữ tài sản, KHÔNG đặt lệnh thay
 * người dùng, và các tín hiệu/bộ lọc chỉ là công cụ tham khảo. Nếu sau này app có thêm
 * chức năng đặt lệnh hay thanh toán trong ứng dụng thì phải sửa lại văn bản này TRƯỚC.
 */
export const INVESTMENT_DISCLAIMER = {
  title: "Miễn trừ trách nhiệm đầu tư",
  effectiveDate: EFFECTIVE_DATE,
  intro: `${OPERATOR_NAME} là công cụ hỗ trợ theo dõi và phân tích dữ liệu thị trường chứng khoán. Vui lòng đọc kỹ những giới hạn dưới đây trước khi sử dụng thông tin trong ứng dụng cho quyết định đầu tư của bạn.`,
  sections: [
    {
      heading: "1. Không phải tư vấn đầu tư",
      paragraphs: [
        `Toàn bộ nội dung trong ứng dụng — biểu đồ, chỉ báo, bộ lọc, tín hiệu, xếp hạng và các số liệu thống kê — chỉ mang tính tham khảo. Đây KHÔNG phải là tư vấn đầu tư, khuyến nghị mua bán, chào bán hay mời chào giao dịch bất kỳ chứng khoán nào. ${OPERATOR_NAME} không phải là công ty chứng khoán và không cung cấp dịch vụ tư vấn đầu tư theo quy định của pháp luật.`,
      ],
    },
    {
      heading: "2. Nguồn dữ liệu và độ chính xác",
      items: [
        "Dữ liệu thị trường trong ứng dụng được lấy từ nhà cung cấp bên ngoài, có thể bị trễ so với thời gian thực.",
        "Dữ liệu có thể thiếu, sai lệch hoặc gián đoạn do lỗi của nguồn cung cấp, lỗi đường truyền hoặc sự cố kỹ thuật.",
        "Chúng tôi không cam kết dữ liệu hiển thị là chính xác, đầy đủ hay cập nhật tại mọi thời điểm.",
      ],
      notes: [
        "Trước khi đặt lệnh, bạn cần đối chiếu với bảng giá chính thức của công ty chứng khoán nơi bạn mở tài khoản.",
      ],
    },
    {
      heading: "3. Tín hiệu và bộ lọc là công cụ, không phải lời hứa",
      paragraphs: [
        "Các tín hiệu, bộ lọc và mô hình trong ứng dụng được tính toán từ dữ liệu quá khứ theo những quy tắc định sẵn. Kết quả trong quá khứ không bảo đảm cho kết quả trong tương lai. Chúng tôi không cam kết bất kỳ mức lợi nhuận nào và không bảo đảm rằng một tín hiệu sẽ đúng.",
      ],
    },
    {
      heading: "4. Bạn tự chịu trách nhiệm cho quyết định của mình",
      paragraphs: [
        "Mọi quyết định mua, bán hoặc nắm giữ chứng khoán là quyết định của riêng bạn, dựa trên đánh giá của bạn về mục tiêu tài chính, khả năng chịu rủi ro và tình hình cá nhân. Bạn nên tham khảo ý kiến của chuyên gia tư vấn tài chính có giấy phép trước khi đầu tư.",
      ],
    },
    {
      heading: "5. Rủi ro thị trường",
      paragraphs: [
        "Đầu tư chứng khoán luôn có rủi ro, bao gồm rủi ro mất một phần hoặc toàn bộ vốn. Giá chứng khoán biến động theo nhiều yếu tố nằm ngoài khả năng dự báo của bất kỳ công cụ phân tích nào.",
      ],
    },
    {
      heading: "6. Ứng dụng không thực hiện giao dịch",
      items: [
        `${OPERATOR_NAME} không nhận tiền, không giữ tài sản và không quản lý danh mục đầu tư của bạn.`,
        "Ứng dụng không kết nối tới tài khoản chứng khoán của bạn và không đặt lệnh thay bạn.",
        "Số tài khoản chứng khoán bạn nhập khi đăng ký chỉ dùng làm định danh đăng nhập.",
      ],
    },
    {
      heading: "7. Giới hạn trách nhiệm",
      paragraphs: [
        `Trong phạm vi pháp luật cho phép, ${OPERATOR_NAME} không chịu trách nhiệm đối với bất kỳ thiệt hại nào phát sinh từ việc bạn sử dụng hoặc không sử dụng được thông tin trong ứng dụng, bao gồm thua lỗ trong giao dịch, mất cơ hội đầu tư hoặc thiệt hại do dữ liệu sai lệch, gián đoạn dịch vụ.`,
      ],
    },
    {
      heading: "8. Liên hệ",
      paragraphs: [
        `Nếu bạn có câu hỏi về nội dung này, vui lòng liên hệ: ${CONTACT_EMAIL}. Văn bản có hiệu lực từ ngày ${EFFECTIVE_DATE}.`,
      ],
    },
  ],
};
