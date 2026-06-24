import {
  FaCaretDown,
  FaCaretUp,
  FaChartLine,
  FaCoins,
  FaEquals,
  FaMoneyBillWave,
} from "react-icons/fa";
import { GiLion } from "react-icons/gi";
import SupplyBalanceScene from "./SupplyBalanceScene";
import "../styles/homePage.scss";
import useTopVolumn from "../hooks/useTopVolumn";
import { buildFlowMap } from "../untils/flowMapData";

export const DEFAULT_HOME_MARKET_DATA = {
  brand: {
    name: "LEOSTOCK",
    tagline: "Invest for your future",
  },
  title: "Toàn cảnh cung cầu thị trường",
  updatedAt: {
    label: "Cập nhật lúc",
    time: "10:30",
    date: "24/05/2024",
  },
  balance: {
    title: "Cân bằng cung cầu",
    subtitle: "Tổng quan toàn thị trường",
    buy: { percent: 74, label: "Phe mua", value: "1,258", unit: "tỷ đồng" },
    sell: { percent: 26, label: "Phe bán", value: "443", unit: "tỷ đồng" },
    summary: [
      {
        label: "Chênh lệch cung cầu",
        value: "+815",
        unit: "tỷ đồng",
        tone: "positive",
        icon: "trend",
      },
      {
        label: "Tổng giá trị khớp lệnh",
        value: "1,701",
        unit: "tỷ đồng",
        tone: "neutral",
      },
    ],
  },
  flowMap: {
    title: "La bàn dòng tiền - top 10 mã ảnh hưởng",
    legends: [
      { label: "Mã có cầu cao", tone: "positive" },
      { label: "Mã có cung cao", tone: "negative" },
    ],
    compass: ["N", "E", "S", "W"],
    center: {
      eyebrow: "Tổng",
      label: "Tổng cung cầu",
      value: "1,701",
      unit: "tỷ đồng",
    },
    points: [
      {
        symbol: "LPB",
        value: "+192",
        tone: "positive",
        strength: "strong",
        angle: 0,
        radius: 34,
      },
      {
        symbol: "FPT",
        value: "+21",
        tone: "positive",
        strength: "medium",
        angle: 48,
        radius: 42,
      },
      {
        symbol: "BID",
        value: "+5",
        tone: "positive",
        strength: "weak",
        angle: 84,
        radius: 44,
      },
      {
        symbol: "KHG",
        value: "-3",
        tone: "negative",
        strength: "weak",
        angle: 118,
        radius: 43,
      },
      {
        symbol: "SBT",
        value: "-1",
        tone: "negative",
        strength: "weak",
        angle: 150,
        radius: 42,
      },
      {
        symbol: "PET",
        value: "-28",
        tone: "negative",
        strength: "strong",
        angle: 180,
        radius: 35,
      },
      {
        symbol: "REE",
        value: "-2",
        tone: "negative",
        strength: "medium",
        angle: 214,
        radius: 41,
      },
      {
        symbol: "HAG",
        value: "-7",
        tone: "negative",
        strength: "medium",
        angle: 248,
        radius: 38,
      },
      {
        symbol: "STB",
        value: "+9",
        tone: "positive",
        strength: "medium",
        angle: 276,
        radius: 39,
      },
      {
        symbol: "VIB",
        value: "+54",
        tone: "positive",
        strength: "strong",
        angle: 318,
        radius: 42,
      },
    ],
    influence: [
      {
        title: "Ảnh hưởng tích cực",
        tone: "positive",
        levels: [
          { label: "Mạnh", count: 3 },
          { label: "Trung bình", count: 2 },
          { label: "Yếu", count: 1 },
        ],
      },
      {
        title: "Ảnh hưởng tiêu cực",
        tone: "negative",
        levels: [
          { label: "Mạnh", count: 3 },
          { label: "Trung bình", count: 2 },
          { label: "Yếu", count: 1 },
        ],
      },
    ],
  },
  marketStats: [
    {
      label: "Mã tăng giá",
      value: "192",
      detail: "Chiếm 48.5%",
      tone: "positive",
      icon: "up",
    },
    {
      label: "Mã giảm giá",
      value: "136",
      detail: "Chiếm 34.3%",
      tone: "negative",
      icon: "down",
    },
    {
      label: "Mã tham chiếu",
      value: "68",
      detail: "Chiếm 17.2%",
      tone: "warning",
      icon: "flat",
    },
    {
      label: "KL khớp lệnh",
      value: "823.6",
      detail: "Triệu CP",
      tone: "positive",
      icon: "cash",
    },
    {
      label: "GT khớp lệnh",
      value: "17,801",
      detail: "Tỷ đồng",
      tone: "warning",
      icon: "coin",
    },
  ],
};

const iconByName = {
  up: FaCaretUp,
  down: FaCaretDown,
  flat: FaEquals,
  cash: FaMoneyBillWave,
  coin: FaCoins,
  trend: FaChartLine,
};

function getPointPosition(angle, radius = 38) {
  const radian = (angle * Math.PI) / 180;

  return {
    left: `${50 + Math.sin(radian) * radius}%`,
    top: `${50 - Math.cos(radian) * radius}%`,
  };
}

function ToneIcon({ name }) {
  const Icon = iconByName[name] || FaChartLine;
  return <Icon aria-hidden="true" />;
}

function MetricValue({ value, unit, tone }) {
  return (
    <>
      <strong
        className={`home-market__value home-market__value--${tone || "neutral"}`}
      >
        {value}
      </strong>
      {unit ? <span>{unit}</span> : null}
    </>
  );
}

function BalancePanel({ data }) {
  return (
    <section
      className="home-card supply-balance"
      aria-labelledby="supply-balance-title"
    >
      <div className="home-section-title">
        <h2 id="supply-balance-title">{data.title}</h2>
        <p>{data.subtitle}</p>
      </div>

      <div className="supply-balance__body">
        <div className="supply-balance__side supply-balance__side--buy">
          <MetricValue value={`${data.buy.percent}%`} tone="positive" />
          <b>{data.buy.label}</b>
          <strong>{data.buy.value}</strong>
          <span>{data.buy.unit}</span>
        </div>

        <SupplyBalanceScene
          buyPercent={data.buy.percent}
          sellPercent={data.sell.percent}
        />

        <div className="supply-balance__side supply-balance__side--sell">
          <MetricValue value={`${data.sell.percent}%`} tone="negative" />
          <b>{data.sell.label}</b>
          <strong>{data.sell.value}</strong>
          <span>{data.sell.unit}</span>
        </div>
      </div>

      <div className="supply-balance__summary">
        {data.summary.map((item) => (
          <article key={item.label}>
            {item.icon ? (
              <div
                className={`home-market__icon home-market__icon--${item.tone}`}
              >
                <ToneIcon name={item.icon} />
              </div>
            ) : null}
            <div>
              <span>{item.label}</span>
              <MetricValue
                value={item.value}
                unit={item.unit}
                tone={item.tone}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FlowMap({ data }) {
  return (
    <section className="home-card flow-map" aria-labelledby="flow-map-title">
      <div className="home-section-title">
        <h2 id="flow-map-title">{data.title}</h2>
        <div className="flow-map__legend">
          {data.legends.map((item) => (
            <span
              key={item.label}
              className={`flow-map__legend-item flow-map__legend-item--${item.tone}`}
            >
              <i />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flow-map__content">
        <div className="flow-map__radar">
          <div className="flow-map__rings" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span className="flow-map__axis flow-map__axis--vertical" />
          <span className="flow-map__axis flow-map__axis--horizontal" />
          {(data.compass || []).map((direction) => (
            <b
              key={direction}
              className={`flow-map__compass flow-map__compass--${direction.toLowerCase()}`}
            >
              {direction}
            </b>
          ))}

          <div className="flow-map__center">
            {data.center.eyebrow ? <span>{data.center.eyebrow}</span> : null}
            <b>{data.center.label}</b>
            <strong>{data.center.value}</strong>
            <small>{data.center.unit}</small>
          </div>

          {data.points.map((point) => (
            <article
              key={point.symbol}
              className={`flow-map__point flow-map__point--${point.tone} flow-map__point--${point.strength}`}
              style={getPointPosition(point.angle, point.radius)}
            >
              <b>{point.symbol}</b>
              <span>{point.value}</span>
            </article>
          ))}
        </div>

        <aside className="flow-map__influence" aria-label="Chú giải ảnh hưởng">
          {data.influence.map((group) => (
            <div
              key={group.title}
              className={`flow-map__influence-group flow-map__influence-group--${group.tone}`}
            >
              <h3>{group.title}</h3>
              {group.levels.map((level) => (
                <div key={level.label} className="flow-map__level">
                  <span>{level.label}</span>
                  <div>
                    {Array.from({ length: level.count }).map((_, index) => (
                      <i key={`${level.label}-${index}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

function MarketStats({ items }) {
  return (
    <section
      className="home-card market-stats"
      aria-label="Thống kê thị trường"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className={`market-stats__item market-stats__item--${item.tone}`}
        >
          <div className={`home-market__icon home-market__icon--${item.tone}`}>
            <ToneIcon name={item.icon} />
          </div>
          <div>
            <span>{item.label}</span>
            <MetricValue value={item.value} tone={item.tone} />
            <small>{item.detail}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function HomePage({ data = DEFAULT_HOME_MARKET_DATA }) {
  const { data: topVolume } = useTopVolumn();
  // Có dữ liệu top-volume thật → dựng FlowMap từ nó; chưa có (đang tải/lỗi) →
  // dùng flowMap mặc định để trang vẫn hiển thị.
  const flowMapData = topVolume?.length ? buildFlowMap(topVolume) : data.flowMap;
  return (
    <main className="home-market">
      <header className="home-market__header">
        <div className="home-market__brand" aria-label={data.brand.name}>
          <GiLion />
          <div>
            <strong>{data.brand.name}</strong>
            <span>{data.brand.tagline}</span>
          </div>
        </div>

        <h1>{data.title}</h1>

        <div className="home-market__updated">
          {data.updatedAt.label ? <span>{data.updatedAt.label}</span> : null}
          <b>
            {data.updatedAt.time} | {data.updatedAt.date}
          </b>
          <button type="button" aria-label="Thông tin thị trường">
            i
          </button>
        </div>
      </header>

      <div className="home-market__grid">
        <BalancePanel data={data.balance} />
        <FlowMap data={flowMapData} />
        <MarketStats items={data.marketStats} />
      </div>
    </main>
  );
}

export default HomePage;
