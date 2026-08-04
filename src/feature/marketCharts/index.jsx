import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BsGraphUpArrow } from "react-icons/bs";
import ChartHeader from "../../components/ChartHeader";
import ChartListButton from "./layouts/ChartListButton";
import { ChartSection, ChartVisibilityProvider } from "./layouts/ChartSection";
import { useChartVisibility } from "./hooks/useChartVisibility";
import { MARKET_CHARTS, scrollToChart } from "./untils/chartList";
import { useTplusWave } from "../tplusWave/hooks/useTplusWave";
import TplusWaveRadar from "../tplusWave/layouts/TplusWaveRadar";
import PotentialFlowChart from "../potentialFlow/layouts/PotentialFlowChart";
import TopGainT2Chart from "../topGainT2/layouts/TopGainT2Chart";
import TopGainT3Chart from "../topGainT3/layouts/TopGainT3Chart";
import TopGainWeekChart from "../topGainWeek/layouts/TopGainWeekChart";
import FlowSurgeChart from "../flowSurge/layouts/FlowSurgeChart";
import FlowSurgeMonthChart from "../flowSurgeMonth/layouts/FlowSurgeMonthChart";
import IndexOverviewChart from "../indexOverview/layouts/IndexOverviewChart";
import MarketStatusChart from "../marketStatus/layouts/MarketStatusChart";
import ForeignBuyChart from "../foreignBuy/layouts/ForeignBuyChart";
import ForeignSellChart from "../foreignSell/layouts/ForeignSellChart";
import BullBearChart from "../bullBear/layouts/BullBearChart";
import PriceBandChart from "../priceBand/layouts/PriceBandChart";
import SectorFlowValueChart from "../sectorFlowValue/layouts/SectorFlowValueChart";
import SectorFlowShareChart from "../sectorFlowShare/layouts/SectorFlowShareChart";
import SectorBreadthChart from "../sectorBreadth/layouts/SectorBreadthChart";
import SectorChangeChart from "../sectorChange/layouts/SectorChangeChart";
import Vn30BasketChart from "../vn30Basket/layouts/Vn30BasketChart";
import MoneyFlowPage from "../moneyflow";
import PutThroughPage from "../putThrough";
import TopValueChart from "../topValue/layouts/TopValueChart";
import TopVolumeChart from "../topVolume/layouts/TopVolumeChart";
import TopAdvanceChart from "../topAdvance/layouts/TopAdvanceChart";
import TopDeclineChart from "../topDecline/layouts/TopDeclineChart";
import SectorFlowSurgeChart from "../sectorFlowSurge/layouts/SectorFlowSurgeChart";
import SectorFlowConsistencyChart from "../sectorFlowConsistency/layouts/SectorFlowConsistencyChart";
import BaseBreakoutChart from "../baseBreakout/layouts/BaseBreakoutChart";
// Ba "bản đồ thị trường" trước đây là trang riêng trong submenu cùng tên; đã
// gộp vào đây để tất cả nằm chung một mục "Biểu đồ thị trường". Route cũ
// (/chart/heatmap, /chart/power, /home) vẫn giữ để không gãy link đã lưu.
import HeatmapPage from "../heatmap";
import PowerPage from "../power";
import HomePage from "../homepage/layouts/HomePage";
import ForeignTradingHistoryChart from "../foreignTrading/layouts/ForeignTradingChart";
import "./styles/marketCharts.scss";

const MARKET_CHART_LABELS = Object.fromEntries(MARKET_CHARTS.map(({ id, label }) => [id, label]));

function TplusChartPanel() {
  const { data, isLoading, isError } = useTplusWave();

  if (isLoading) {
    return <div className="market-chart-pair__state">Đang tải dữ liệu T+…</div>;
  }

  if (isError) {
    return <div className="market-chart-pair__state">Không tải được dữ liệu T+</div>;
  }

  if (!data || data.symbols.length === 0) {
    return <div className="market-chart-pair__state">Hiện chưa có mã đang có sóng tăng T+</div>;
  }

  return <TplusWaveRadar payload={data} />;
}

export default function MarketChartsPage() {
  const location = useLocation();
  const { visible, toggleChart, showChart, showAll, hideAll } = useChartVisibility();
  const hasVisibleChart = MARKET_CHARTS.some((chart) => visible[chart.id] !== false);

  // Mọi <ChartSection> đều có id trùng hash nên tra thẳng bằng getElementById —
  // không cần 23 ref song song với danh sách (dễ lệch khi thêm biểu đồ mới).
  // setTimeout 0 để chờ section vừa mount xong mới cuộn.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return undefined;

    // Link sâu (#id) tới biểu đồ người dùng đã ẩn: bật lại rồi mới cuộn, không
    // thì mở link xong chẳng thấy gì mà cũng không hiểu vì sao.
    showChart(id);

    const timer = window.setTimeout(() => {
      scrollToChart(id);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash, showChart]);

  return (
    <ChartVisibilityProvider visible={visible}>
      <main className="market-chart-pair">
        <ChartListButton
          visible={visible}
          onToggleChart={toggleChart}
          onShowChart={showChart}
          onShowAll={showAll}
          onHideAll={hideAll}
        />
        {!hasVisibleChart && (
          <p className="market-chart-pair__empty">
            Chưa chọn biểu đồ nào — mở danh sách ở góc trên bên phải để bật lại.
          </p>
        )}
        {/* Bản đồ sức mạnh dòng tiền đứng riêng ở đầu trang và chiếm gần trọn viewport. */}
        <ChartSection
          id="power-map"
          className="market-chart-pair__panel market-chart-pair__panel--wide market-chart-pair__panel--power"
          aria-label={MARKET_CHART_LABELS["power-map"]}
        >
          <PowerPage />
        </ChartSection>

        <ChartSection
          id="tplus-wave"
          className="market-chart-pair__panel market-chart-pair__panel--tplus"
          aria-label={MARKET_CHART_LABELS["tplus-wave"]}
        >
          <ChartHeader
            id="tplus-wave-title"
            icon={<BsGraphUpArrow />}
            title="BẢN ĐỒ SỨC MẠNH TĂNG GIÁ CỔ PHIẾU"
            variant="navy"
            accent="#35c66b"
            className="market-chart-pair__tplus-header"
          />
          <div className="market-chart-pair__tplus-chart">
            <TplusChartPanel />
          </div>
        </ChartSection>
        {/* Radar sức mạnh tăng giá cổ phiếu ghép cặp với bộ lọc mã tiềm năng lướt T+. */}
        <ChartSection
          id="potential-flow"
          className="market-chart-pair__panel market-chart-pair__panel--potential"
          aria-label={MARKET_CHART_LABELS["potential-flow"]}
        >
          <PotentialFlowChart />
        </ChartSection>
        <ChartSection
          id="top-gain-t2"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-gain-t2"]}
        >
          <TopGainT2Chart window={2} />
        </ChartSection>

        <ChartSection
          id="top-gain-t3"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-gain-t3"]}
        >
          <TopGainT3Chart window={3} />
        </ChartSection>

        <ChartSection
          id="top-gain-week"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-gain-week"]}
        >
          <TopGainWeekChart />
        </ChartSection>

        <ChartSection
          id="flow-surge"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["flow-surge"]}
        >
          <FlowSurgeChart />
        </ChartSection>

        <ChartSection
          id="index-overview"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["index-overview"]}
        >
          <IndexOverviewChart />
        </ChartSection>

        <ChartSection
          id="market-status"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["market-status"]}
        >
          <MarketStatusChart />
        </ChartSection>

        <ChartSection
          id="foreign-buy"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["foreign-buy"]}
        >
          <ForeignBuyChart />
        </ChartSection>

        <ChartSection
          id="foreign-sell"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["foreign-sell"]}
        >
          <ForeignSellChart />
        </ChartSection>
        <ChartSection
          id="money-flow"
          className="market-chart-pair__panel market-chart-pair__panel--moneyflow"
          aria-label={MARKET_CHART_LABELS["money-flow"]}
        >
          <MoneyFlowPage />
        </ChartSection>
        <ChartSection
          id="put-through"
          className="market-chart-pair__panel market-chart-pair__panel--treemap"
          aria-label={MARKET_CHART_LABELS["put-through"]}
        >
          <PutThroughPage />
        </ChartSection>
        <ChartSection
          id="bull-bear"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["bull-bear"]}
        >
          <BullBearChart />
        </ChartSection>
        <ChartSection
          id="price-band"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["price-band"]}
        >
          <PriceBandChart />
        </ChartSection>
        <ChartSection
          id="sector-flow-value"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["sector-flow-value"]}
        >
          <SectorFlowValueChart />
        </ChartSection>
        <ChartSection
          id="sector-flow-share"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["sector-flow-share"]}
        >
          <SectorFlowShareChart />
        </ChartSection>
        <ChartSection
          id="sector-breadth"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["sector-breadth"]}
        >
          <SectorBreadthChart />
        </ChartSection>
        <ChartSection
          id="sector-change"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["sector-change"]}
        >
          <SectorChangeChart />
        </ChartSection>
        <ChartSection
          id="vn30-basket"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["vn30-basket"]}
        >
          <Vn30BasketChart />
        </ChartSection>
        <ChartSection
          id="flow-surge-month"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["flow-surge-month"]}
        >
          <FlowSurgeMonthChart />
        </ChartSection>
        <ChartSection
          id="top-value"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-value"]}
        >
          <TopValueChart />
        </ChartSection>

        <ChartSection
          id="top-volume-view"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-volume-view"]}
        >
          <TopVolumeChart />
        </ChartSection>

        <ChartSection
          id="sector-flow-surge"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["sector-flow-surge"]}
        >
          <SectorFlowSurgeChart />
        </ChartSection>

        {/* --wide: lưới 30-60 cột + 2 cột chỉ số không vừa nửa hàng; panel hẹp đẩy
            TB/ĐLC và "phiên +" ra ngoài vùng cuộn ngang, tức mất đúng con số xếp
            hạng mà chart này tồn tại để hiển thị. */}
      

        <ChartSection
          id="top-advance"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-advance"]}
        >
          <TopAdvanceChart />
        </ChartSection>

        <ChartSection
          id="top-decline"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["top-decline"]}
        >
          <TopDeclineChart />
        </ChartSection>

        <ChartSection
          id="foreign-trading-history"
          className="market-chart-pair__panel market-chart-pair__panel--top-gain"
          aria-label={MARKET_CHART_LABELS["foreign-trading-history"]}
        >
          <ForeignTradingHistoryChart />
        </ChartSection>
        <ChartSection
          id="sector-flow-consistency"
          className="market-chart-pair__panel market-chart-pair__panel--wide market-chart-pair__panel--consistency"
          aria-label={MARKET_CHART_LABELS["sector-flow-consistency"]}
        >
          <SectorFlowConsistencyChart />
        </ChartSection>

        {/* --wide bắt buộc: nội dung là một ảnh nền 1920×1080 với 15 bong bóng
            vẽ sẵn, nhét vào nửa cột thì chữ trong bong bóng nhỏ tới mức không
            đọc được. */}
        <ChartSection
          id="base-breakout"
          className="market-chart-pair__panel market-chart-pair__panel--wide market-chart-pair__panel--base-breakout"
          aria-label={MARKET_CHART_LABELS["base-breakout"]}
        >
          <BaseBreakoutChart />
        </ChartSection>

        {/* Ba bản đồ chiếm CẢ hai cột: chúng vốn là trang riêng chiếm trọn bề
            ngang, nhét vào nửa cột thì treemap/vòng tròn bị bóp không đọc nổi. */}
        <ChartSection
          id="heatmap"
          className="market-chart-pair__panel market-chart-pair__panel--wide market-chart-pair__panel--heatmap"
          aria-label={MARKET_CHART_LABELS["heatmap"]}
        >
          <HeatmapPage />
        </ChartSection>

      

        {/* <ChartSection
          id="market-overview"
          className="market-chart-pair__panel market-chart-pair__panel--wide market-chart-pair__panel--overview"
          aria-label="Bản đồ toàn cảnh thị trường"
        >
          <HomePage />
        </ChartSection> */}
      </main>
    </ChartVisibilityProvider>
  );
}
