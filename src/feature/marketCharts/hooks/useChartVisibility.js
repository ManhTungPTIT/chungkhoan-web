import { useCallback, useState } from "react";
import { MARKET_CHARTS } from "../untils/chartList";
import {
  buildDefaultVisibility,
  loadChartVisibility,
  saveChartVisibility,
} from "../untils/chartVisibility";

/**
 * Trạng thái hiện/ẩn từng biểu đồ của trang /chart/market.
 *
 * State nằm ở trang (MarketChartsPage) và truyền xuống ChartListButton bằng
 * props — chỉ một cha một con nên chưa cần context.
 *
 * Đọc localStorage bằng lazy initializer để không chạy lại mỗi lần render, và
 * ghi ngay trong hàm cập nhật thay vì useEffect: mỗi lần state đổi là do đúng
 * một thao tác của người dùng, không có nguồn nào khác cần đồng bộ ngược lại.
 */
export function useChartVisibility(charts = MARKET_CHARTS) {
  const [visible, setVisible] = useState(() => loadChartVisibility(undefined, charts));

  const persist = useCallback(
    (next) => {
      saveChartVisibility(next, undefined, charts);
      return next;
    },
    [charts],
  );

  const toggleChart = useCallback(
    (id) => {
      setVisible((current) => persist({ ...current, [id]: !current[id] }));
    },
    [persist],
  );

  const showChart = useCallback(
    (id) => {
      setVisible((current) => {
        // Hash lạ (không phải id biểu đồ nào) thì kệ — đừng nhét khoá rác vào map.
        if (!(id in current) || current[id]) return current;
        return persist({ ...current, [id]: true });
      });
    },
    [persist],
  );

  const showAll = useCallback(() => {
    setVisible(() => persist(buildDefaultVisibility(charts)));
  }, [charts, persist]);

  const hideAll = useCallback(() => {
    setVisible(() =>
      persist(
        charts.reduce((next, chart) => {
          next[chart.id] = false;
          return next;
        }, {}),
      ),
    );
  }, [charts, persist]);

  return { visible, toggleChart, showChart, showAll, hideAll };
}

export default useChartVisibility;
