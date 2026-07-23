import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTplusWave } from "../tplusWave/hooks/useTplusWave";
import TplusWaveRadar from "../tplusWave/layouts/TplusWaveRadar";
import PotentialFlowChart from "../potentialFlow/layouts/PotentialFlowChart";
import TopGainT2Chart from "../topGainT2/layouts/TopGainT2Chart";
import TopGainT3Chart from "../topGainT3/layouts/TopGainT3Chart";
import TopGainWeekChart from "../topGainWeek/layouts/TopGainWeekChart";
import FlowSurgeChart from "../flowSurge/layouts/FlowSurgeChart";
import IndexOverviewChart from "../indexOverview/layouts/IndexOverviewChart";
import MarketStatusChart from "../marketStatus/layouts/MarketStatusChart";
import ForeignBuyChart from "../foreignBuy/layouts/ForeignBuyChart";
import ForeignSellChart from "../foreignSell/layouts/ForeignSellChart";
import TopValueChart from "../topValue/layouts/TopValueChart";
import TopVolumeChart from "../topVolume/layouts/TopVolumeChart";
import TopDeclineChart from "../topDecline/layouts/TopDeclineChart";
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
  const indexOverviewRef = useRef(null);
  const marketStatusRef = useRef(null);
  const foreignBuyRef = useRef(null);
  const foreignSellRef = useRef(null);
  const topValueRef = useRef(null);
  const topVolumeRef = useRef(null);
  const topDeclineRef = useRef(null);

  useEffect(() => {
    const targetRef = {
      "#potential-flow": potentialRef,
      "#tplus-wave": tplusRef,
      "#top-gain-t2": topGainT2Ref,
      "#top-gain-t3": topGainT3Ref,
      "#top-gain-week": topGainWeekRef,
      "#flow-surge": flowSurgeRef,
      "#index-overview": indexOverviewRef,
      "#market-status": marketStatusRef,
      "#foreign-buy": foreignBuyRef,
      "#foreign-sell": foreignSellRef,
      "#top-value": topValueRef,
      "#top-volume-view": topVolumeRef,
      "#top-decline": topDeclineRef,
    }[location.hash] ?? null;

    if (!targetRef?.current) return undefined;

    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <main className="market-chart-pair">
      <section
        ref={potentialRef}
        id="potential-flow"
        className="market-chart-pair__panel market-chart-pair__panel--potential"
        aria-label="Biểu đồ mã cổ phiếu tiềm năng"
      >
        <PotentialFlowChart />
      </section>

      <section
        ref={tplusRef}
        id="tplus-wave"
        className="market-chart-pair__panel market-chart-pair__panel--tplus"
        aria-label="Biểu đồ radar sóng tăng T+"
      >
        <div className="market-chart-pair__tplus-chart">
          <TplusChartPanel />
        </div>
      </section>
      <section
        ref={topGainT2Ref}
        id="top-gain-t2"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất T+2"
      >
        <TopGainT2Chart window={2} />
      </section>

      <section
        ref={topGainT3Ref}
        id="top-gain-t3"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất T+3"
      >
        <TopGainT3Chart window={3} />
      </section>

      <section
        ref={topGainWeekRef}
        id="top-gain-week"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ top tăng cao nhất tuần"
      >
        <TopGainWeekChart />
      </section>

      <section
        ref={flowSurgeRef}
        id="flow-surge"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ dòng tiền tăng đột biến hôm nay"
      >
        <FlowSurgeChart />
      </section>

      <section
        ref={indexOverviewRef}
        id="index-overview"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ chỉ số chung 3 sàn"
      >
        <IndexOverviewChart />
      </section>

      <section
        ref={marketStatusRef}
        id="market-status"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ diễn biến thị trường"
      >
        <MarketStatusChart />
      </section>

      <section
        ref={foreignBuyRef}
        id="foreign-buy"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị nước ngoài mua ròng cao nhất"
      >
        <ForeignBuyChart />
      </section>

      <section
        ref={foreignSellRef}
        id="foreign-sell"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị nước ngoài bán ròng cao nhất"
      >
        <ForeignSellChart />
      </section>

      <section
        ref={topValueRef}
        id="top-value"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ giá trị tiền khớp lệnh cao nhất"
      >
        <TopValueChart />
      </section>

      <section
        ref={topVolumeRef}
        id="top-volume-view"
        className="market-chart-pair__panel market-chart-pair__panel--top-gain"
        aria-label="Biểu đồ khối lượng khớp lệnh cao nhất"
      >
        <TopVolumeChart />
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