import { fmtVolume } from "../untils/putThroughData";

// Bảng số liệu — chế độ xem thay thế cho người không phân biệt được màu, và là
// chỗ đọc khối lượng/số lệnh mà treemap không hiện.
export default function PutThroughTable({ items, total }) {
  return (
    <div className="tm-table-wrap">
      <table className="tm-table">
        <caption className="sr-only">
          Giá trị giao dịch thỏa thuận theo mã, tổng {Math.round(total / 1e9)} tỷ đồng
        </caption>
        <thead>
          <tr>
            <th scope="col">Mã</th>
            <th scope="col">Ngành</th>
            <th scope="col">Thỏa thuận (tỷ)</th>
            <th scope="col">Khối lượng</th>
            <th scope="col">Số lệnh</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.symbol}>
              <th scope="row">
                <span
                  className="tm-swatch"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                {s.symbol}
              </th>
              <td style={{ textAlign: "left" }}>{s.group}</td>
              <td>{s.ty}</td>
              <td>{fmtVolume(s.volume)}</td>
              <td>{s.dealCount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Tổng</th>
            <td />
            <td>{Math.round(total / 1e9)}</td>
            <td>{fmtVolume(items.reduce((n, s) => n + s.volume, 0))}</td>
            <td>{items.reduce((n, s) => n + s.dealCount, 0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
