import "./chartHeader.scss";

/**
 * Header dùng chung cho mọi biểu đồ (thanh gradient + badge icon + tiêu đề).
 *
 * Props:
 * - id: id cho <h2> (dùng với aria-labelledby của card)
 * - icon: node react-icons hiển thị trong badge tròn
 * - eyebrow: dòng nhỏ phía trên tiêu đề (tuỳ chọn)
 * - title: chuỗi, node, hoặc mảng dòng — mảng sẽ xuống dòng
 * - subtitle: dòng nhỏ mờ phía dưới tiêu đề (tuỳ chọn)
 * - variant: theme gradient ("navy" | "purple" | "blue" | "market" | "teal")
 * - accent: màu icon/điểm nhấn của badge (tuỳ chọn, mặc định theo variant)
 * - control: node bên phải (dropdown, cụm nút…) (tuỳ chọn)
 * - className: class phụ cho <header>
 */
export default function ChartHeader({
    id,
    icon,
    eyebrow,
    title,
    subtitle,
    variant = "navy",
    accent,
    control,
    className = "",
}) {
    const lines = Array.isArray(title) ? title : [title];
    const style = accent ? { "--ch-accent": accent } : undefined;

    return (
        <header className={`chart-header chart-header--${variant} ${className}`.trim()} style={style}>
            {icon && (
                <span className="chart-header__badge" aria-hidden="true">
                    {icon}
                </span>
            )}
            <div className="chart-header__text">
                {eyebrow && <span className="chart-header__eyebrow">{eyebrow}</span>}
                <h2 id={id} className="chart-header__title">
                    {lines.map((line, index) => (
                        <span className="chart-header__title-line" key={index}>
                            {line}
                        </span>
                    ))}
                </h2>
                {subtitle && <span className="chart-header__subtitle">{subtitle}</span>}
            </div>
            {control && <div className="chart-header__control">{control}</div>}
        </header>
    );
}
