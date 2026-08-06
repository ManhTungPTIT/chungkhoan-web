import LegalDocument from "../components/LegalDocument";
import { PRIVACY_POLICY } from "../content/privacyPolicy";

// Route công khai /legal/privacy — ĐÂY là URL nộp cho Google Play, phải mở được khi
// chưa đăng nhập (xem routes/AppRoute.jsx: đặt ngoài cả PrivateRoute lẫn GuestRoute).
export default function PrivacyPolicyPage() {
  return <LegalDocument document={PRIVACY_POLICY} />;
}
