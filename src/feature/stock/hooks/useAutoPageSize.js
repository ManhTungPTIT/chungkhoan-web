import { useEffect, useState } from "react";

/**
 * Số dòng vừa khít chiều cao còn lại của màn hình.
 *
 * Đo từ đỉnh `tbody` tới đáy viewport rồi chia cho chiều cao một dòng: màn to →
 * nhiều dòng, màn nhỏ → ít dòng. Cả bản web lẫn bản app đều giữ phân trang nên
 * cùng cần phép đo này.
 *
 * `reserve` là chỗ chừa cho những thứ nằm DƯỚI bảng (thanh phân trang, dòng gợi
 * ý…) — mỗi bản một con số khác nhau nên truyền vào chứ không cắm cứng.
 */
export function useAutoPageSize(tableRef, { fallback = 6, reserve = 50, deps = [] } = {}) {
  const [pageSize, setPageSize] = useState(fallback);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return undefined;

    const recompute = () => {
      const tbody = el.querySelector("tbody");
      if (!tbody) return;
      const firstRow = tbody.querySelector("tr");
      const rowH = firstRow?.getBoundingClientRect().height || 72;
      const top = tbody.getBoundingClientRect().top;
      const avail = window.innerHeight - top - reserve;
      const fit = Math.max(3, Math.floor(avail / rowH));
      setPageSize((prev) => (prev !== fit ? fit : prev));
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRef, reserve, ...deps]);

  return pageSize;
}

export default useAutoPageSize;
