import { useEffect, useMemo, useRef, useState } from "react";
import { FiMail, FiPhone, FiSave } from "react-icons/fi";

import { detectAccountType } from "../untils/accountType";
import { persistStoredUser, readStoredUser } from "../untils/userStore";
import { useAccountUser } from "../hooks/useAccountUser";

// Danh sách nơi cư trú rút gọn — thêm/bớt tuỳ nhu cầu.
const RESIDENCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Khác",
];

/**
 * Thẻ tóm tắt + form thông tin cá nhân.
 *
 * Dùng chung cho bản web (một tab trong InfoUser) và bản app (màn /info/profile). Không tự
 * dựng khung, không tự đặt tiêu đề — nơi gọi lo phần đó.
 */
export default function ProfileForm() {
  const { user } = useAccountUser();

  const [form, setForm] = useState(() => {
    const u = readStoredUser() ?? {};
    return {
      fullName: u.fullName ?? "",
      residence: u.residence ?? "",
      bio: u.bio ?? "",
      advisorPhone: u.advisorPhone ?? "",
      contact: "", // email hoặc SĐT còn thiếu
    };
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Seed họ tên từ server ĐÚNG MỘT LẦN: request có thể về lại giữa lúc người dùng đang gõ,
  // ghi đè mỗi lần dữ liệu mới về là xoá mất thứ họ vừa nhập.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!user || seededRef.current) return;
    setForm((p) => ({ ...p, fullName: user.fullName ?? p.fullName }));
    seededRef.current = true;
  }, [user]);

  // Cái nào đã có thì khoá; cái còn thiếu cho nhập (email ↔ SĐT).
  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phoneNumber;
  const missingType =
    hasEmail && !hasPhone ? "phone" : !hasEmail && hasPhone ? "email" : null;

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setError("");
    setSaved(false);
  };

  const avatarChar = useMemo(
    () => (form.fullName || user?.fullName || "U").trim().charAt(0).toUpperCase(),
    [form.fullName, user],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      return;
    }

    const patch = {
      fullName: form.fullName.trim(),
      residence: form.residence,
      bio: form.bio.trim(),
      advisorPhone: form.advisorPhone.trim(),
    };

    // Trường email/SĐT còn thiếu (nếu người dùng nhập)
    const contact = form.contact.trim();
    if (missingType && contact) {
      const type = detectAccountType(contact);
      if (missingType === "phone" && type !== "phone") {
        setError("Số điện thoại không hợp lệ");
        return;
      }
      if (missingType === "email" && type !== "email") {
        setError("Email không hợp lệ");
        return;
      }
      patch[missingType === "phone" ? "phoneNumber" : "email"] = contact;
    }

    persistStoredUser(patch);
    setForm((p) => ({ ...p, contact: "" }));
    setSaved(true);
  };

  return (
    <div className="iu-body">
      {/* Cột trái: thẻ tóm tắt */}
      <aside className="iu-card iu-summary">
        <div className="iu-summary__head">
          {user?.avatarUrl ? (
            <img
              className="iu-avatar iu-avatar--img"
              src={user.avatarUrl}
              alt={user.fullName || "Avatar"}
            />
          ) : (
            <div className="iu-avatar">{avatarChar}</div>
          )}
          <div>
            <div className="iu-name">
              {form.fullName || user?.fullName || "Người dùng"}
            </div>
            <div className="iu-role">
              {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
            </div>
          </div>
        </div>
        <div className="iu-summary__row">
          <FiMail />
          <span className="iu-summary__label">Email</span>
          <span className="iu-summary__value">
            {user?.email || "Chưa cập nhật"}
          </span>
        </div>
        <div className="iu-summary__row">
          <FiPhone />
          <span className="iu-summary__label">Phone</span>
          <span className="iu-summary__value">
            {user?.phoneNumber || "Chưa cập nhật"}
          </span>
        </div>
      </aside>

      {/* Cột phải: form */}
      <form className="iu-card iu-form" onSubmit={handleSubmit}>
        <h3 className="iu-form__title">Thông tin cá nhân</h3>

        <div className="iu-grid">
          <div className="iu-field">
            <label>
              Họ và tên <span className="req">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={setField("fullName")}
            />
          </div>

          <div className="iu-field">
            <label>Nơi cư trú</label>
            <select value={form.residence} onChange={setField("residence")}>
              <option value="">Không xác định</option>
              {RESIDENCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trường email/SĐT còn thiếu: dùng email đăng nhập thì nhập SĐT và ngược lại */}
        {missingType && (
          <div className="iu-field">
            <label>{missingType === "phone" ? "Số điện thoại" : "Email"}</label>
            <input
              type={missingType === "phone" ? "tel" : "email"}
              placeholder={
                missingType === "phone"
                  ? "Nhập số điện thoại của bạn"
                  : "Nhập email của bạn"
              }
              value={form.contact}
              onChange={setField("contact")}
            />
          </div>
        )}

        <div className="iu-field">
          <label>Tiểu sử</label>
          <textarea rows={3} value={form.bio} onChange={setField("bio")} />
        </div>

        {error && <div className="iu-msg iu-msg--error">{error}</div>}
        {saved && <div className="iu-msg iu-msg--ok">Đã cập nhật thành công.</div>}

        <div className="iu-form__foot">
          <button type="submit" className="iu-btn">
            <FiSave /> Cập nhật
          </button>
        </div>
      </form>
    </div>
  );
}
