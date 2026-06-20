import { useMemo, useState } from "react";
import { FiUser, FiMail, FiPhone, FiSave, FiKey } from "react-icons/fi";
import { detectAccountType } from "../untils/accountType";
import "../styles/infoUser.scss";

// Danh sách nơi cư trú rút gọn — thêm/bớt tuỳ nhu cầu.
const RESIDENCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Khác",
];

// Đọc user từ store auth-storage (zustand persist) trong localStorage.
function readStoredUser() {
  try {
    const raw = localStorage.getItem("auth-storage");
    return raw ? JSON.parse(raw)?.state?.user ?? null : null;
  } catch {
    return null;
  }
}

// Ghi các thay đổi user trở lại localStorage (merge, giữ nguyên phần còn lại).
function persistStoredUser(patch) {
  try {
    const raw = localStorage.getItem("auth-storage");
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = {
      ...parsed.state,
      user: { ...parsed.state?.user, ...patch },
    };
    localStorage.setItem("auth-storage", JSON.stringify(parsed));
  } catch {
    // bỏ qua: không chặn UX nếu localStorage lỗi
  }
}

export default function InfoUser() {
  const [tab, setTab] = useState("info");

  // Nguồn dữ liệu: localStorage (không gọi API)
  const [user, setUser] = useState(() => readStoredUser());

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
    setUser((prev) => ({ ...prev, ...patch }));
    setForm((p) => ({ ...p, contact: "" }));
    setSaved(true);
  };

  if (!user) {
    return (
      <div className="info-user">
        <div className="iu-state iu-state--error">
          Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }

  return (
    <div className="info-user">
      <div className="iu-tabs">
        <button
          className={tab === "info" ? "is-active" : ""}
          onClick={() => setTab("info")}
        >
          <FiUser /> Thông tin Tài khoản
        </button>
        <button
          className={tab === "password" ? "is-active" : ""}
          onClick={() => setTab("password")}
        >
          <FiKey /> Đổi mật khẩu
        </button>
      </div>

      {tab === "info" && (
        <div className="iu-body">
          {/* Cột trái: thẻ tóm tắt */}
          <aside className="iu-card iu-summary">
            <div className="iu-summary__head">
              <div className="iu-avatar">{avatarChar}</div>
              <div>
                <div className="iu-name">{user.fullName || "Người dùng"}</div>
                <div className="iu-role">Người dùng</div>
              </div>
            </div>
            <div className="iu-summary__row">
              <FiMail />
              <span className="iu-summary__label">Email</span>
              <span className="iu-summary__value">
                {user.email || "Chưa cập nhật"}
              </span>
            </div>
            <div className="iu-summary__row">
              <FiPhone />
              <span className="iu-summary__label">Phone</span>
              <span className="iu-summary__value">
                {user.phoneNumber || "Chưa cập nhật"}
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
                <label>
                  {missingType === "phone" ? "Số điện thoại" : "Email"}
                </label>
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

            <div className="iu-field">
              <label>Số điện thoại NV Tư vấn</label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại của Nhân viên Tư vấn (nếu có)"
                value={form.advisorPhone}
                onChange={setField("advisorPhone")}
              />
            </div>

            {error && <div className="iu-msg iu-msg--error">{error}</div>}
            {saved && (
              <div className="iu-msg iu-msg--ok">Đã cập nhật thành công.</div>
            )}

            <div className="iu-form__foot">
              <button type="submit" className="iu-btn">
                <FiSave /> Cập nhật
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "password" && (
        <div className="iu-card iu-state">
          Chức năng đổi mật khẩu sẽ sớm có.
        </div>
      )}
    </div>
  );
}
