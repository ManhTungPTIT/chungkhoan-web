import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BsGraphUpArrow } from "react-icons/bs";
import ChartHeader from "../../components/ChartHeader";
import ChartListButton from "./layouts/ChartListButton";
import { scrollToChart } from "./untils/chartList";
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
import TopDeclineChart from "../topDecline/layouts/TopDeclineChart";
import SectorFlowSurgeChart from "../sectorFlowSurge/layouts/SectorFlowSurgeChart";
import "./styles/marketCharts.scss";

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
  const potentialRef = useRef(null);
  const tplusRef = useRef(null);
  const topGainT2Ref = useRef(null);
  const topGainT3Ref = useRef(null);
  const topGainWeekRef = useRef(null);
  const flowSurgeRef = useRef(null);
  const flowSurgeMonthRef = useRef(null);
  const indexOverviewRef = useRef(null);
  const marketStatusRef = useRef(null);
  const foreignBuyRef = useRef(null);
  const foreignSellRef = useRef(null);
  const moneyFlowRef = useRef(null);
  const putThroughRef = useRef(null);
  const bullBearRef = useRef(null);
  const priceBandRef = useRef(null);
  const sectorFlowValueRef = useRef(null);
  const sectorFlowShareRef = useRef(null);
  const sectorBreadthRef = useRef(null);
  const sectorChangeRef = useRef(null);
  const vn30BasketRef = useRef(null);
  const topValueRef = useRef(null);
  const topVolumeRef = useRef(null);
  const topDeclineRef = useRef(null);
  const sectorFlowSurgeRef = useRef(null);

  // Mọi <section> đều có id trùng hash nên tra thẳng bằng getElementById —
  // không cần 23 ref song song với danh sách (dễ lệch khi thêm biểu đồ mới).
  // setTimeout 0 để chờ section vừa mount xong mới cuộn.
  useEffect(() => {
    const targetRef = {
      "#potential-flow": potentialRef,
      "#tplus-wave": tplusRef,
      "#top-gain-t2": topGainT2Ref,
      "#top-gain-t3": topGainT3Ref,
      "#top-gain-week": topGainWeekRef,
      "#flow-surge": flowSurgeRef,
      "#flow-surge-month": flowSurgeMonthRef,
      "#index-overview": indexOverviewRef,
      "#market-status": marketStatusRef,
      "#foreign-buy": foreignBuyRef,
      "#foreign-sell": foreignSellRef,
      "#money-flow": moneyFlowRef,
      "#put-through": putThroughRef,
      "#bull-bear": bullBearRef,
      "#price-band": priceBandRef,
      "#sector-flow-value": sectorFlowValueRef,
      "#sector-flow-share": sectorFlowShareRef,
      "#sector-breadth": sectorBreadthRef,
      "#sector-change": sectorChangeRef,
      "#vn30-basket": vn30BasketRef,
      "#top-value": topValueRef,
      "#top-volume-view": topVolumeRef,
      "#top-decline": topDeclineRef,
      "#sector-flow-surge": sectorFlowSurgeRef,
    }[location.hash] ?? null;

    if (!targetRef?.current) return undefined;

    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 0);

    const timer = window.setTimeout(() => scrollToChart(id), 0);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <main className="market-chart-pair">
      <ChartListButton />
      <section
        id="potential-flow"
        className="market-chart-pair__panel market-chart-pair__panel--potential"
        aria-label="Biểu đồ mã cổ phiếu tiềm năng"
      >
        <PotentialFlowChart />
      </section>

      <section
        id="tplus-wave"
        className="market-chart-pair__panel market-chart-pair__panel--tplus"
        aria-label="Biểu đồ radar sóng tăng T+"
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
      </section>
      <section
        id="top-gain-t2"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất T+2"
      >
        <TopGainT2Chart window={2} />
      </section>

      <section
        id="top-gain-t3"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất T+3"
      >
        <TopGainT3Chart window={3} />
      </section>

      <section
        id="top-gain-week"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất tuần"
      >
        <TopGainWeekChart />
      </section>

      <section
        id="flow-surge"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ dòng tiền tăng đột biến hôm nay"
      >
        <FlowSurgeChart />
      </section>

      <section
        id="index-overview"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ chỉ số chung 3 sàn"
      >
        <IndexOverviewChart />
      </section>

      <section
        id="market-status"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ diễn biến thị trường"
      >
        <MarketStatusChart />
      </section>

      <section
        id="foreign-buy"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị nước ngoài mua ròng cao nhất"
      >
        <ForeignBuyChart />
      </section>

      <section
        id="foreign-sell"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị nước ngoài bán ròng cao nhất"
      >
        <ForeignSellChart />
      </section>
      <section
        id="money-flow"
        className="market-chart-pair__panel market-chart-pair__panel--moneyflow"
        aria-label="Money flow theo nganh"
      >
        <MoneyFlowPage />
      </section>
      <section
        id="put-through"
        className="market-chart-pair__panel market-chart-pair__panel--treemap"
        aria-label="Dòng tiền giao dịch thỏa thuận theo mã"
      >
        <PutThroughPage />
      </section>
      <section
        id="bull-bear"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ dòng tiền phe bò và phe gấu"
      >
        <BullBearChart />
      </section>
      <section
        id="price-band"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ dòng tiền theo nhóm giá cổ phiếu"
      >
        <PriceBandChart />
      </section>
      <section
        id="sector-flow-value"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị tiền khớp lệnh 5 phiên gần nhất theo ngành"
      >
        <SectorFlowValueChart />
      </section>
      <section
        id="sector-flow-share"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ tỷ trọng giá trị tiền khớp lệnh 5 phiên gần nhất theo ngành"
      >
        <SectorFlowShareChart />
      </section>
      <section
        id="sector-breadth"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ xu hướng dòng tiền tích cực tiêu cực theo ngành"
      >
        <SectorBreadthChart />
      </section>
      <section
        id="sector-change"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ tổng hợp tăng giảm theo ngành"
      >
        <SectorChangeChart />
      </section>
      <section
        id="vn30-basket"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ mã rổ VN30"
      >
        <Vn30BasketChart />
      </section>
       <section
        id="flow-surge-month"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ dòng tiền tăng đột biến so với bình quân 1 tháng"
      >
        <FlowSurgeMonthChart />
      </section>
      <section
        id="top-value"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị tiền khớp lệnh cao nhất"
      >
        <TopValueChart />
      </section>

      <section
        id="top-volume-view"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ khối lượng khớp lệnh cao nhất"
      >
        <TopVolumeChart />
      </section>

      <section
        ref={sectorFlowSurgeRef}
        id="sector-flow-surge"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Ngành có dòng tiền tăng đột biến"
      >
        <SectorFlowSurgeChart />
      </section>

      <section
        ref={topDeclineRef}
        id="top-decline"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top giảm cao nhất"
      >
        <TopDeclineChart />
      </section>
    </main>
  );
}
