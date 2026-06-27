export const INDICATOR_SETTINGS_STORAGE_KEY = "chart.indicatorSettings.v1";

const LINE_COLORS = [
  "#2962FF",
  "#9C27B0",
  "#26A69A",
  "#EF5350",
  "#F59E0B",
  "#42A5F5",
  "#7E57C2",
];

export const DISPLAY_SCOPES = [
  { key: "small", label: "Sóng nhỏ", min: 1, max: 59 },
  { key: "hour", label: "Giờ", min: 1, max: 24 },
  { key: "day", label: "Ngày", min: 1, max: 366 },
  { key: "week", label: "Tuần", min: 1, max: 52 },
  { key: "month", label: "Tháng", min: 1, max: 12 },
];

export const ALL_INDICATORS = [
  { name: "MA", label: "MA — Trung bình động", pane: "candle_pane", params: [{ label: "P1", defaultValue: 5 }, { label: "P2", defaultValue: 10 }, { label: "P3", defaultValue: 30 }] },
  { name: "EMA", label: "EMA — TB động luỹ thừa", pane: "candle_pane", params: [{ label: "Nhanh", defaultValue: 10 }, { label: "Chậm", defaultValue: 20 }] },
  { name: "SMA", label: "SMA — TB động giản đơn", pane: "candle_pane", params: [{ label: "Chu kỳ", defaultValue: 12 }, { label: "M", defaultValue: 2 }] },
  { name: "BBI", label: "BBI — Bull & Bear Index", pane: "candle_pane", params: [{ label: "P1", defaultValue: 3 }, { label: "P2", defaultValue: 6 }, { label: "P3", defaultValue: 12 }, { label: "P4", defaultValue: 24 }] },
  { name: "BOLL", label: "BOLL — Bollinger Bands", pane: "candle_pane", params: [{ label: "Chu kỳ", defaultValue: 20 }, { label: "Độ lệch", defaultValue: 2, step: 0.1 }], lines: [{ label: "Upper" }, { label: "Mid" }, { label: "Lower" }] },
  { name: "SAR", label: "SAR — Parabolic SAR", pane: "candle_pane", params: [{ label: "Step", defaultValue: 2 }, { label: "Max", defaultValue: 20 }], lines: [{ label: "SAR" }] },
  { name: "AVP", label: "AVP — Giá bình quân", pane: "candle_pane", lines: [{ label: "AVP" }] },
  {
    name: "ICHIMOKU",
    label: "Ichimoku — Mây Kumo",
    pane: "candle_pane",
    params: [{ label: "Tenkan", defaultValue: 9 }, { label: "Kijun", defaultValue: 26 }, { label: "Span B", defaultValue: 52 }, { label: "Dịch", defaultValue: 26, min: 0 }],
    lines: [
      { label: "Tenkan", color: "#2962FF" },
      { label: "Kijun", color: "#B71C1C" },
      { label: "Span A", color: "#26A69A" },
      { label: "Span B", color: "#EF5350" },
      { label: "Chikou", color: "#9C27B0" },
    ],
  },
  { name: "VOL", label: "VOL — Khối lượng", pane: "sub" },
  { name: "MCDX", label: "MCDX — Dòng tiền", pane: "sub", params: [{ label: "Banker", defaultValue: 50 }, { label: "Hot", defaultValue: 21 }, { label: "Shark", defaultValue: 10 }] },
  { name: "MACD", label: "MACD", pane: "sub", params: [{ label: "Fast", defaultValue: 12 }, { label: "Slow", defaultValue: 26 }, { label: "Signal", defaultValue: 9 }], lines: [{ label: "DIF" }, { label: "DEA" }, { label: "MACD" }] },
  { name: "KDJ", label: "KDJ — Stochastic", pane: "sub", params: [{ label: "N", defaultValue: 9 }, { label: "M1", defaultValue: 3 }, { label: "M2", defaultValue: 3 }], lines: [{ label: "K" }, { label: "D" }, { label: "J" }] },
  { name: "RSI", label: "RSI", pane: "sub", params: [{ label: "P1", defaultValue: 6 }, { label: "P2", defaultValue: 12 }, { label: "P3", defaultValue: 24 }] },
  { name: "BIAS", label: "BIAS — Độ lệch", pane: "sub", params: [{ label: "P1", defaultValue: 6 }, { label: "P2", defaultValue: 12 }, { label: "P3", defaultValue: 24 }] },
  { name: "BRAR", label: "BRAR", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 26 }], lines: [{ label: "BR" }, { label: "AR" }] },
  { name: "CCI", label: "CCI", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 13 }] },
  { name: "DMI", label: "DMI", pane: "sub", params: [{ label: "P1", defaultValue: 14 }, { label: "P2", defaultValue: 6 }], lines: [{ label: "PDI" }, { label: "MDI" }, { label: "ADX" }, { label: "ADXR" }] },
  { name: "CR", label: "CR", pane: "sub", params: [{ label: "P1", defaultValue: 26 }, { label: "P2", defaultValue: 10 }, { label: "P3", defaultValue: 20 }, { label: "P4", defaultValue: 40 }, { label: "P5", defaultValue: 60 }] },
  { name: "PSY", label: "PSY — Psychological Line", pane: "sub", params: [{ label: "P1", defaultValue: 12 }, { label: "P2", defaultValue: 6 }] },
  { name: "DMA", label: "DMA", pane: "sub", params: [{ label: "Short", defaultValue: 10 }, { label: "Long", defaultValue: 50 }, { label: "M", defaultValue: 10 }] },
  { name: "TRIX", label: "TRIX", pane: "sub", params: [{ label: "P1", defaultValue: 12 }, { label: "P2", defaultValue: 20 }] },
  { name: "OBV", label: "OBV", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 30 }] },
  { name: "VR", label: "VR — Volume Ratio", pane: "sub", params: [{ label: "P1", defaultValue: 24 }, { label: "P2", defaultValue: 30 }] },
  { name: "WR", label: "WR — Williams %R", pane: "sub", params: [{ label: "P1", defaultValue: 13 }, { label: "P2", defaultValue: 34 }] },
  { name: "MTM", label: "MTM — Momentum", pane: "sub", params: [{ label: "P1", defaultValue: 6 }, { label: "P2", defaultValue: 10 }] },
  { name: "ROC", label: "ROC", pane: "sub", params: [{ label: "P1", defaultValue: 12 }, { label: "P2", defaultValue: 6 }] },
  { name: "EMV", label: "EMV", pane: "sub", params: [{ label: "P1", defaultValue: 14 }, { label: "P2", defaultValue: 9 }] },
  { name: "PVT", label: "PVT", pane: "sub", lines: [{ label: "PVT" }] },
  { name: "AO", label: "AO — Awesome Oscillator", pane: "sub", params: [{ label: "Fast", defaultValue: 5 }, { label: "Slow", defaultValue: 34 }], lines: [{ label: "AO" }] },
];

export const DEFAULT_ACTIVE_INDICATORS = {
  EMA: true,
  VOL: true,
};

export function getIndicatorDefinition(name) {
  return ALL_INDICATORS.find((indicator) => indicator.name === name);
}

export function getIndicatorLineDefinitions(indicatorOrName) {
  const indicator =
    typeof indicatorOrName === "string"
      ? getIndicatorDefinition(indicatorOrName)
      : indicatorOrName;
  if (!indicator) return [];
  if (indicator.lines?.length) return indicator.lines;
  if (indicator.params?.length) {
    return indicator.params.map((param, index) => ({
      label: param.label ?? `Line ${index + 1}`,
    }));
  }
  return [];
}

function defaultLineStyle(line, index) {
  return {
    label: line.label,
    visible: true,
    color: line.color ?? LINE_COLORS[index % LINE_COLORS.length],
    size: 1,
    style: "solid",
  };
}

function defaultDisplayScope(scope) {
  return {
    key: scope.key,
    label: scope.label,
    visible: true,
    min: scope.min,
    max: scope.max,
  };
}

function buildDefaultLineConfig(indicator) {
  const lines = getIndicatorLineDefinitions(indicator);
  if (!lines.length) return {};
  return {
    styles: { lines: lines.map(defaultLineStyle) },
  };
}

export function buildDefaultIndicatorConfigs(definitions = ALL_INDICATORS) {
  return definitions.reduce((configs, indicator) => {
    const hasParams = indicator.params?.length;
    const lineConfig = buildDefaultLineConfig(indicator);
    configs[indicator.name] = {
      ...(hasParams
        ? { params: indicator.params.map((param) => param.defaultValue) }
        : {}),
      ...lineConfig,
      display: { scopes: DISPLAY_SCOPES.map(defaultDisplayScope) },
    };
    return configs;
  }, {});
}

function asBool(value, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback;
}

function normalizeNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return fallback;
  return number;
}

function normalizeLineStyles(userLines = [], defaultLines = []) {
  return defaultLines.map((fallback, index) => {
    const user = userLines[index] ?? {};
    return {
      label: fallback.label,
      visible: asBool(user.visible, fallback.visible),
      color: normalizeColor(user.color, fallback.color),
      size: normalizeNumber(user.size, fallback.size, 1, 6),
      style: ["solid", "dashed"].includes(user.style)
        ? user.style
        : fallback.style,
    };
  });
}

function normalizeDisplayScopes(userScopes = [], defaultScopes = []) {
  return defaultScopes.map((fallback, index) => {
    const user = userScopes[index] ?? {};
    return {
      key: fallback.key,
      label: fallback.label,
      visible: asBool(user.visible, fallback.visible),
      min: normalizeNumber(user.min, fallback.min, 1, 500),
      max: normalizeNumber(user.max, fallback.max, 1, 500),
    };
  });
}

export function normalizeIndicatorConfigs(configs = {}, definitions = ALL_INDICATORS) {
  const defaults = buildDefaultIndicatorConfigs(definitions);
  return definitions.reduce((normalized, indicator) => {
    const defaultConfig = defaults[indicator.name];
    if (!defaultConfig) return normalized;

    const userConfig = configs[indicator.name] ?? {};
    const nextConfig = {};

    if (indicator.params?.length) {
      const userParams = userConfig.params ?? [];
      nextConfig.params = indicator.params.map((param, index) => {
        const value = Number(userParams[index]);
        const min = param.min ?? 1;
        const max = param.max ?? 500;
        if (!Number.isFinite(value) || value < min || value > max) {
          return defaultConfig.params[index];
        }
        return value;
      });
    }

    if (defaultConfig.styles?.lines?.length) {
      nextConfig.styles = {
        lines: normalizeLineStyles(
          userConfig.styles?.lines,
          defaultConfig.styles.lines,
        ),
      };
    }

    if (defaultConfig.display?.scopes?.length) {
      nextConfig.display = {
        scopes: normalizeDisplayScopes(
          userConfig.display?.scopes,
          defaultConfig.display.scopes,
        ),
      };
    }

    normalized[indicator.name] = nextConfig;
    return normalized;
  }, {});
}

export function serializeIndicatorState(active, configs) {
  return {
    active: { ...active },
    configs: normalizeIndicatorConfigs(configs),
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadIndicatorState(storage) {
  const fallback = {
    active: DEFAULT_ACTIVE_INDICATORS,
    configs: buildDefaultIndicatorConfigs(),
  };

  try {
    const stored = resolveStorage(storage)?.getItem(
      INDICATOR_SETTINGS_STORAGE_KEY,
    );
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return {
      active: { ...DEFAULT_ACTIVE_INDICATORS, ...(parsed.active ?? {}) },
      configs: normalizeIndicatorConfigs(parsed.configs),
    };
  } catch {
    return fallback;
  }
}

export function saveIndicatorState(active, configs, storage) {
  try {
    resolveStorage(storage)?.setItem(
      INDICATOR_SETTINGS_STORAGE_KEY,
      JSON.stringify(serializeIndicatorState(active, configs)),
    );
  } catch {
    // localStorage can be unavailable in private browsing or restricted frames.
  }
}
