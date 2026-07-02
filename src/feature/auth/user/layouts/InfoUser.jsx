import { useEffect, useMemo, useRef, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiSave, FiKey, FiPackage } from "react-icons/fi";
import { detectAccountType } from "../untils/accountType";
import { useMe, useRequestPackage } from "../hooks/useMe";
import { useChangePassword } from "../hooks/useChangePassword";
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
const PACKAGE_OPTIONS = [
  { id: "1", days: 30, title: "30 ngày", description: "Dùng thử tín hiệu trong 1 tháng" },
  { id: "2",days: 90, title: "90 ngày", description: "Theo dõi một quý giao dịch" },
  { id: "3",days: 180, title: "180 ngày", description: "Phù hợp nhà đầu tư trung hạn" },
  { id: "4",days: 365, title: "1 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
  { id: "5",days: 1095, title: "3 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
  { id: "6",days: 1825, title: "5 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
];

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
}

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

  // Role được MainLayout truyền qua navigate("/info", { state: { role } }).
  // Chỉ có khi vào trang bằng điều hướng SPA; gõ thẳng URL / F5 thì state rỗng
  // → fallback về role trong hồ sơ user (apiUser/localStorage) bên dưới.


  // Nguồn chuẩn: API /user/me. localStorage chỉ để fallback khi API chưa về/lỗi.
  const { data: apiUser, isLoading, isError } = useMe();
  const user = apiUser ?? readStoredUser();


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
  const [selectedPackageDays, setSelectedPackageDays] = useState(90);
  const [packageRequest, setPackageRequest] = useState(
    () => user?.packageRequest ?? readStoredUser()?.packageRequest ?? null,
  );
  const [packageError, setPackageError] = useState("");
  const [packageSaved, setPackageSaved] = useState(false);
  const requestPackage = useRequestPackage();

  // Khi dữ liệu API về: merge vào user, đồng bộ localStorage (cho nơi khác đọc)
  // và seed lại họ tên từ server đúng một lần — không ghi đè khi user đang sửa form.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!apiUser) return;
    persistStoredUser(apiUser);
    if (apiUser.packageRequest) setPackageRequest(apiUser.packageRequest);
    if (!seededRef.current) {
      setForm((p) => ({ ...p, fullName: apiUser.fullName ?? p.fullName }));
      seededRef.current = true;
    }
  }, [apiUser]);

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

  // ---------- Đổi mật khẩu ----------
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const setPwField = (key) => (e) => {
    setPwForm((p) => ({ ...p, [key]: e.target.value }));
    setPwError("");
    setPwSaved(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const { current, next, confirm } = pwForm;

    if (!current || !next || !confirm) {
      setPwError("Vui lòng nhập đầy đủ các trường");
      return;
    }
    if (next.length < 6) {
      setPwError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (next !== confirm) {
      setPwError("Xác nhận mật khẩu không khớp");
      return;
    }
    if (next === current) {
      setPwError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setPwError("");
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setPwSaved(true);
          setPwForm({ current: "", next: "", confirm: "" });
        },
        onError: (err) => {
          setPwError(
            err?.response?.data?.message ||
              "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.",
          );
        },
      },
    );
  };

  const handleRequestPackage = () => {
    setPackageError("");
    setPackageSaved(false);
    requestPackage.mutate(
      { days: selectedPackageDays },
      {
        onSuccess: (response) => {
          const nextRequest = response?.packageRequest ?? response ?? {
            days: selectedPackageDays,
            status: "pending",
            requestedAt: new Date().toISOString(),
          };
          setPackageRequest(nextRequest);
          persistStoredUser({ packageRequest: nextRequest });
          setPackageSaved(true);
        },
        onError: (err) => {
          setPackageError(
            err?.response?.data?.message ||
              "Gửi yêu cầu đăng ký gói thất bại. Vui lòng thử lại.",
          );
        },
      },
    );
  };

  // Chưa có dữ liệu nào (cả cache lẫn API) mà API đang tải → hiện trạng thái tải.
  if (!user && isLoading) {
    return (
      <div className="info-user">
        <div className="iu-state">Đang tải thông tin tài khoản…</div>
      </div>
    );
  }

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
      {isError && (
        <div className="iu-msg iu-msg--error">
          Không tải được dữ liệu mới nhất — đang hiển thị thông tin đã lưu.
        </div>
      )}
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
        {user.role !== "admin" ? (
          <button
          className={tab === "package" ? "is-active" : ""}
          onClick={() => setTab("package")}
        >
          <FiPackage /> Gói đăng ký
        </button>
        ) : ""}
        
      </div>

      {tab === "info" && (
        <div className="iu-body">
          {/* Cột trái: thẻ tóm tắt */}
          <aside className="iu-card iu-summary">
            <div className="iu-summary__head">
              {user.avatarUrl ? (
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
                  {form.fullName || user.fullName || "Người dùng"}
                </div>
                <div className="iu-role">
                  {user.role === "admin"
                    ? "Quản trị viên"
                    : "Người dùng"}
                </div>
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

            {/* <div className="iu-field">
              <label>Số điện thoại NV Tư vấn</label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại của Nhân viên Tư vấn (nếu có)"
                value={form.advisorPhone}
                onChange={setField("advisorPhone")}
              />
            </div> */}

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

      {tab === "package" && user.role !== "admin" (
        <div className="iu-card iu-form iu-package">
          <div className="iu-package__head">
            <div>
              <h3 className="iu-form__title">Gói đăng ký</h3>
              <p className="iu-package__desc">
                Chọn gói bạn muốn sử dụng. Yêu cầu sẽ được gửi cho admin duyệt trước khi kích hoạt.
              </p>
            </div>
            <div className="iu-package__status">
              <span>Hết hạn</span>
              <strong>{formatDate(user.expiresAt)}</strong>
            </div>
          </div>

          {packageRequest?.status === "pending" && (
            <div className="iu-msg iu-msg--pending">
              Gói {packageRequest.days} ngày đang chờ admin duyệt.
            </div>
          )}

          <div className="iu-package-grid">
            {PACKAGE_OPTIONS.map((pkg) => (
              <button
                key={pkg.days}
                type="button"
                className={`iu-package-card${
                  selectedPackageDays === pkg.days ? " is-selected" : ""
                }`}
                onClick={() => {
                  setSelectedPackageDays(pkg.days);
                  setPackageError("");
                  setPackageSaved(false);
                }}
              >
                <span className="iu-package-card__title">{pkg.title}</span>
                <span className="iu-package-card__desc">{pkg.description}</span>
              </button>
            ))}
          </div>

          {packageError && (
            <div className="iu-msg iu-msg--error">{packageError}</div>
          )}
          {packageSaved && (
            <div className="iu-msg iu-msg--ok">
              Đã gửi yêu cầu đăng ký gói. Vui lòng chờ admin duyệt.
            </div>
          )}

          <div className="iu-form__foot">
            <button
              type="button"
              className="iu-btn"
              disabled={requestPackage.isPending}
              onClick={handleRequestPackage}
            >
              {requestPackage.isPending ? "Đang gửi…" : "Gửi yêu cầu duyệt"}
            </button>
          </div>
        </div>
      )}

      {tab === "password" && (
        <form className="iu-card iu-form" onSubmit={handleChangePassword}>
          <h3 className="iu-form__title">Đổi mật khẩu</h3>

          <div className="iu-field">
            <label>
              Mật khẩu hiện tại <span className="req">*</span>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu hiện tại của bạn"
              value={pwForm.current}
              onChange={setPwField("current")}
            />
            
          </div>

          <div className="iu-grid">
            <div className="iu-field">
              <label>
                Mật khẩu mới <span className="req">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
                value={pwForm.next}
                onChange={setPwField("next")}
              />
            </div>
            <div className="iu-field">
              <label>
                Xác nhận mật khẩu <span className="req">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                value={pwForm.confirm}
                onChange={setPwField("confirm")}
              />
            </div>
          </div>

          {pwError && <div className="iu-msg iu-msg--error">{pwError}</div>}
          {pwSaved && (
            <div className="iu-msg iu-msg--ok">Đổi mật khẩu thành công.</div>
          )}

          <div className="iu-form__foot">
            <button
              type="submit"
              className="iu-btn iu-btn--primary"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? "Đang đổi…" : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
