import { fmtTyDong } from "../untils/moneyFlowData";

// Bảng số liệu — vừa là chế độ xem thay thế cho người không phân biệt được màu,
// vừa là chỗ đọc con số chính xác mà treemap không hiển thị hết.
export default function SectorFlowTable({ items, total }) {
  return (
    <div className="tm-table-wrap">
      <table className="tm-table">
        <caption className="sr-only">
          Tỷ trọng giá trị khớp lệnh theo ngành, tổng {fmtTyDong(total)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Ngành</th>
            <th scope="col">GT khớp lệnh</th>
            <th scope="col">Tỷ trọng</th>
            <th scope="col">Số mã</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.icb_code || s.name}>
              <th scope="row">
                <span
                  className="tm-swatch"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                {s.name}
              </th>
              <td>{fmtTyDong(s.value)}</td>
              <td>{s.pct}%</td>
              <td>{s.symbolCount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Tổng</th>
            <td>{fmtTyDong(total)}</td>
            <td>100%</td>
            <td>{items.reduce((n, s) => n + s.symbolCount, 0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
