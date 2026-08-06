import { CONTACT_EMAIL, EFFECTIVE_DATE, OPERATOR_NAME } from "../untils/legalInfo";

/**
 * Chính sách quyền riêng tư — nội dung là DỮ LIỆU, không phải JSX.
 *
 * Sửa câu chữ thì không phải đụng vào markup, và test kiểm được từng mục có mặt đủ.
 *
 * Mọi câu ở đây được viết bám đúng thứ hệ thống thực sự làm (userModel.js,
 * refreshTokenModel.js, danh sách phụ thuộc của App/ và chart/). Đừng thêm câu chữ mẫu
 * kiểu "chúng tôi có thể thu thập dữ liệu vị trí, cookie quảng cáo…" nếu app không làm —
 * chính sách nói quá là thứ Google Play soi, và cũng là cam kết sai với người dùng.
 */
export const PRIVACY_POLICY = {
  title: "Chính sách quyền riêng tư",
  effectiveDate: EFFECTIVE_DATE,
  intro: `${OPERATOR_NAME} tôn trọng quyền riêng tư của bạn. Tài liệu này giải thích ứng dụng thu thập những dữ liệu nào, dùng vào việc gì, lưu ở đâu và bạn có những quyền gì đối với dữ liệu của mình.`,
  sections: [
    {
      heading: "1. Đơn vị vận hành và liên hệ",
      paragraphs: [
        `Ứng dụng ${OPERATOR_NAME} do đội ngũ vận hành ${OPERATOR_NAME} cung cấp. Mọi câu hỏi, yêu cầu hoặc khiếu nại liên quan tới dữ liệu cá nhân, bạn gửi về: ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: "2. Dữ liệu chúng tôi thu thập",
      paragraphs: ["Chúng tôi chỉ thu thập dữ liệu cần cho việc tạo và duy trì tài khoản:"],
      items: [
        "Thông tin bạn tự nhập khi đăng ký: họ và tên, địa chỉ email, số điện thoại, công ty chứng khoán và số tài khoản chứng khoán (bạn cung cấp ít nhất một trong các định danh này).",
        "Mật khẩu: chỉ lưu dưới dạng đã băm bằng thuật toán bcrypt. Chúng tôi không lưu và không thể đọc được mật khẩu gốc của bạn.",
        "Thông tin hồ sơ bạn tự bổ sung trong ứng dụng, ví dụ nơi cư trú và phần giới thiệu.",
        "Dữ liệu phiên đăng nhập: mã phiên, nền tảng đang dùng (trình duyệt hoặc ứng dụng di động), thời điểm hết hạn của phiên và mốc hoạt động gần nhất.",
        "Yêu cầu đăng ký gói dịch vụ: tên gói, số ngày, thời điểm yêu cầu và trạng thái duyệt.",
      ],
    },
    {
      heading: "3. Những gì chúng tôi KHÔNG thu thập",
      items: [
        "Chúng tôi không tích hợp bất kỳ công cụ phân tích hành vi hay mạng quảng cáo nào của bên thứ ba trong ứng dụng.",
        "Chúng tôi không thu thập vị trí, danh bạ, ảnh, tin nhắn hay danh sách ứng dụng trên thiết bị của bạn.",
        "Chúng tôi không thu thập thông tin thẻ ngân hàng và không xử lý thanh toán trong ứng dụng.",
        "Chúng tôi không truy cập tài khoản chứng khoán của bạn. Số tài khoản bạn nhập chỉ dùng làm định danh đăng nhập; ứng dụng không kết nối tới công ty chứng khoán để xem số dư hay đặt lệnh thay bạn.",
      ],
    },
    {
      heading: "4. Mục đích sử dụng dữ liệu",
      items: [
        "Tạo tài khoản, xác thực đăng nhập và giữ bạn ở trạng thái đã đăng nhập.",
        "Phân biệt phiên trên trình duyệt và trên ứng dụng, để mỗi tài khoản chỉ dùng trên một trình duyệt và một ứng dụng tại cùng thời điểm.",
        "Xử lý yêu cầu đăng ký gói dịch vụ và quản lý thời hạn sử dụng.",
        "Hỗ trợ bạn khi có sự cố và trả lời khiếu nại.",
      ],
      notes: [
        "Chúng tôi không dùng dữ liệu cá nhân của bạn cho quảng cáo và không bán dữ liệu cho bất kỳ bên nào.",
      ],
    },
    {
      heading: "5. Dữ liệu thị trường",
      paragraphs: [
        "Biểu đồ, bảng giá và các chỉ báo trong ứng dụng lấy từ nhà cung cấp dữ liệu thị trường bên ngoài. Khi ứng dụng lấy dữ liệu thị trường, nó KHÔNG gửi kèm thông tin cá nhân của bạn — các yêu cầu này không mang danh tính người dùng.",
      ],
    },
    {
      heading: "6. Lưu trữ và bảo mật",
      items: [
        "Dữ liệu tài khoản được lưu trong cơ sở dữ liệu do chúng tôi quản lý; chỉ nhân sự vận hành có thẩm quyền mới truy cập được.",
        "Mật khẩu luôn được băm trước khi lưu.",
        "Trên thiết bị của bạn, ứng dụng lưu mã truy cập và một bản sao hồ sơ trong bộ nhớ cục bộ của trình duyệt/ứng dụng để bạn không phải đăng nhập lại mỗi lần mở. Đăng xuất sẽ xoá các dữ liệu này khỏi thiết bị.",
        "Kết nối tới máy chủ của bản phát hành đi qua HTTPS.",
      ],
      notes: [
        "Không có hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng tới dữ liệu cá nhân của bạn, chúng tôi sẽ thông báo theo quy định của pháp luật hiện hành.",
      ],
    },
    {
      heading: "7. Thời gian lưu trữ",
      paragraphs: [
        "Dữ liệu tài khoản được lưu trong suốt thời gian tài khoản còn hiệu lực. Phiên đăng nhập tự hết hạn và bị xoá sau thời hạn của phiên.",
      ],
    },
    {
      heading: "8. Quyền của bạn",
      items: [
        "Xem và cập nhật thông tin hồ sơ trong mục Thông tin cá nhân.",
        "Đổi mật khẩu bất cứ lúc nào.",
        "Xóa tài khoản trong mục Thông tin cá nhân, có xác nhận bằng mật khẩu.",
        `Yêu cầu chúng tôi cung cấp bản sao hoặc xoá dữ liệu cá nhân của bạn, bằng cách gửi thư tới ${CONTACT_EMAIL}.`,
      ],
      notes: [
        "Lưu ý về xóa tài khoản: khi bạn xóa tài khoản, chúng tôi đánh dấu tài khoản là đã xóa và thu hồi toàn bộ phiên đăng nhập trên mọi thiết bị — bạn sẽ không đăng nhập lại được. Bản ghi tài khoản vẫn được giữ lại ở trạng thái đã xóa, nên email, số điện thoại và số tài khoản chứng khoán cũ KHÔNG dùng để đăng ký tài khoản mới được. Nếu bạn muốn xoá vĩnh viễn toàn bộ bản ghi, hãy liên hệ với chúng tôi.",
      ],
    },
    {
      heading: "9. Chia sẻ với bên thứ ba",
      paragraphs: [
        "Chúng tôi không bán, không trao đổi và không cho thuê dữ liệu cá nhân của bạn. Chúng tôi chỉ cung cấp dữ liệu khi có yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền, hoặc khi cần thiết để bảo vệ quyền lợi hợp pháp của người dùng và của chúng tôi.",
      ],
    },
    {
      heading: "10. Trẻ em",
      paragraphs: [
        "Ứng dụng dành cho người từ đủ 16 tuổi trở lên. Chúng tôi không chủ đích thu thập dữ liệu của trẻ em dưới 16 tuổi; nếu phát hiện, chúng tôi sẽ xoá dữ liệu đó.",
      ],
    },
    {
      heading: "11. Thay đổi chính sách",
      paragraphs: [
        `Chính sách này có thể được cập nhật. Bản mới sẽ hiển thị ngay trong ứng dụng kèm ngày hiệu lực mới. Bản hiện tại có hiệu lực từ ngày ${EFFECTIVE_DATE}.`,
      ],
    },
  ],
};
