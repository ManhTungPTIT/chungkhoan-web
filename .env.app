# Biến riêng cho bản build đóng gói vào app native (Capacitor).
# Vite nạp file này khi chạy với `--mode app`; các biến trong `.env` vẫn được nạp
# trước đó nên chỉ cần khai những gì KHÁC bản web.
#
# VITE_TARGET quyết định cách app lấy refresh token: bản app nhận token qua body
# và tự lưu, bản web dùng cookie httpOnly (xem src/feature/auth/untils/appClient.js).
VITE_TARGET=app

# `localhost` trong app trỏ vào CHÍNH thiết bị, không phải máy tính chạy backend.
# Đang đặt theo IP LAN của máy phát triển (đo ngày 27/07/2026) để chạy trên MÁY THẬT.
#
# IP này đổi khi bạn đổi mạng Wi-Fi hoặc router cấp lại DHCP — kiểm tra bằng
# `ipconfig` và sửa lại ở đây, rồi build lại (`npm run sync`).
#
# Dùng MÁY ẢO Android thì thay 192.168.1.23 bằng 10.0.2.2 (bí danh trỏ về máy chủ).
VITE_PYTHON_API_URL=http://192.168.1.23:8000/api/python
VITE_NODEJS_API_URL=http://192.168.1.23:8800/api
