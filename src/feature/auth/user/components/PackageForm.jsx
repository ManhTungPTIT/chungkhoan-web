import { useEffect, useState } from "react";

import { useRequestPackage } from "../hooks/useMe";
import { useAccountUser } from "../hooks/useAccountUser";
import { formatDate, persistStoredUser, readStoredUser } from "../untils/userStore";

const PACKAGE_OPTIONS = [
  { id: "1", days: 30, title: "30 ngày", description: "Dùng thử tín hiệu trong 1 tháng" },
  { id: "2", days: 90, title: "90 ngày", description: "Theo dõi một quý giao dịch" },
  { id: "3", days: 180, title: "180 ngày", description: "Phù hợp nhà đầu tư trung hạn" },
  { id: "4", days: 365, title: "1 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
  { id: "5", days: 1095, title: "3 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
  { id: "6", days: 1825, title: "5 năm", description: "Theo dõi dài hạn với chi phí tốt hơn" },
];

/**
 * Chọn gói và gửi yêu cầu cho admin duyệt. Dùng chung web (tab) và app (/info/package).
 *
 * Chỉ gói đã ở trạng thái `approved` mới được coi là "đang dùng"; yêu cầu `pending` hiện ở
 * dải thông báo riêng. Nhập nhằng hai trạng thái này là bug đã từng xảy ra.
 */
export default function PackageForm() {
  const { user } = useAccountUser();

  const [selectedPackageDays, setSelectedPackageDays] = useState(90);
  const [selectedPackageTitles, setSelectedPackageTitles] = useState("90 ngày");
  const [packageRequest, setPackageRequest] = useState(
    () => readStoredUser()?.packageRequest ?? null,
  );
  const [packageError, setPackageError] = useState("");
  const [packageSaved, setPackageSaved] = useState(false);
  const requestPackage = useRequestPackage();

  useEffect(() => {
    if (user?.packageRequest) setPackageRequest(user.packageRequest);
  }, [user]);

  const handleRequestPackage = () => {
    setPackageError("");
    setPackageSaved(false);
    // Hook/BE nhận { titles, days } — gửi sai tên field (title) sẽ bị BE trả 400.
    requestPackage.mutate(
      {
        titles: selectedPackageTitles,
        days: selectedPackageDays,
      },
      {
        onSuccess: (response) => {
          const nextRequest = response?.packageRequest ??
            response ?? {
              titles: selectedPackageTitles,
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

  return (
    <div className="iu-card iu-form iu-package">
      <div className="iu-package__head">
        <div>
          <h3 className="iu-form__title">Gói đăng ký</h3>
          <p className="iu-package__desc">
            Chọn gói bạn muốn sử dụng. Yêu cầu sẽ được gửi cho admin duyệt trước khi kích
            hoạt.
          </p>
        </div>
        <div className="iu-package__status iu-package__status--current">
          <span>Gói đang dùng</span>
          <strong>
            {packageRequest?.status === "approved" && packageRequest.titles
              ? packageRequest.titles
              : "Chưa có"}
          </strong>
        </div>
        <div className="iu-package__status">
          <span>Hết hạn</span>
          <strong>{formatDate(user?.expiresAt)}</strong>
        </div>
      </div>

      {packageRequest?.status === "pending" && (
        <div className="iu-msg iu-msg--pending">
          Gói {packageRequest.titles ?? `${packageRequest.days} ngày`} đang chờ admin duyệt.
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
              setSelectedPackageTitles(pkg.title);
              setPackageError("");
              setPackageSaved(false);
            }}
          >
            <span className="iu-package-card__title">{pkg.title}</span>
            <span className="iu-package-card__desc">{pkg.description}</span>
          </button>
        ))}
      </div>

      {packageError && <div className="iu-msg iu-msg--error">{packageError}</div>}
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
  );
}
