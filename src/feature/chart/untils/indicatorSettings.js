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
  { name: "MA", label: "MA — Trung bình động", pane: "candle_pane", dynamicParams: true, defaultParams: [5, 10, 20], params: [{ label: "Chu kỳ MA", defaultValue: 5, min: 1, max: 500 }] },
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
    params: [{ label: "Khoảng thời gian quy đổi", defaultValue: 9 }, { label: "Khoảng thời gian Cơ sở", defaultValue: 26 }, { label: "Chu kỳ Đường trễ 2", defaultValue: 52 }, { label: "Lagging Span Periods", defaultValue: 26, min: 0 }, { label: "Kỳ luân chuyển hàng đầu", defaultValue: 26, min: 0 }],
    lines: [
      { label: "Tenkan", color: "#2962FF" },
      { label: "Kijun", color: "#B71C1C" },
      { label: "Span A", color: "#26A69A" },
      { label: "Span B", color: "#EF5350" },
      { label: "Chikou", color: "#9C27B0" },
    ],
    // Mây Kumo: Màu 0 = khi Span A ≥ B (mây tăng), Màu 1 = khi A < B (mây giảm).
    fills: [{ label: "Màu nền Biểu đồ", colors: ["#26A69A", "#EF5350"] }],
  },
  { name: "VOL", label: "VOL — Khối lượng", pane: "sub" },
  {
    name: "MCDX",
    label: "MCDX — Dòng tiền",
    pane: "sub",
    // v2: đổi từ bộ tham số RSV cũ (Lookback/Smooth/Weight và bản 3 tham số
    // trước đó) sang MCDX chuẩn RSI (Period/Baseline/Sensitivity). Ý nghĩa
    // từng VỊ TRÍ đã đổi nên config lưu từ version cũ phải bị bỏ, không được
    // pad theo vị trí (Hot=21 cũ mà thành Baseline=21 sẽ làm banker kịch trần).
    paramsVersion: 2,
    params: [
      { label: "Banker RSI Period", defaultValue: 50 },
      { label: "Banker Baseline", defaultValue: 50 },
      { label: "Banker Sensitivity", defaultValue: 1.5, min: 0.1, step: 0.1 },
      { label: "Hot Money RSI Period", defaultValue: 40 },
      { label: "Hot Money Baseline", defaultValue: 30 },
      { label: "Hot Money Sensitivity", defaultValue: 0.7, min: 0.1, step: 0.1 },
      { label: "Retail RSI Period", defaultValue: 20 },
      { label: "Retail Baseline", defaultValue: 10 },
    ],
  },
  { name: "MACD", label: "MACD", pane: "sub", params: [{ label: "Fast", defaultValue: 12 }, { label: "Slow", defaultValue: 26 }, { label: "Signal", defaultValue: 9 }], lines: [{ label: "DIF" }, { label: "DEA" }, { label: "MACD" }] },
  { name: "KDJ", label: "KDJ — Stochastic", pane: "sub", params: [{ label: "N", defaultValue: 9 }, { label: "M1", defaultValue: 3 }, { label: "M2", defaultValue: 3 }], lines: [{ label: "K" }, { label: "D" }, { label: "J" }] },
  {
    name: "RSI",
    label: "RSI",
    pane: "sub",
    // v2: bỏ RSI built-in 3 chu kỳ [6,12,24] (công thức Cutler) → RSI Wilder
    // MỘT chu kỳ 14 theo mẫu TradingView. Số lượng/ý nghĩa tham số đổi nên
    // config lưu từ version cũ phải bị bỏ, không pad theo vị trí.
    paramsVersion: 2,
    params: [{ label: "Chu kỳ", defaultValue: 14 }],
    lines: [{ label: "RSI", color: "#7E57C2" }],
  },
  { name: "BIAS", label: "BIAS — Độ lệch", pane: "sub", params: [{ label: "P1", defaultValue: 6 }, { label: "P2", defaultValue: 12 }, { label: "P3", defaultValue: 24 }] },
  { name: "BRAR", label: "BRAR", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 26 }], lines: [{ label: "BR" }, { label: "AR" }] },
  { name: "CCI", label: "CCI", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 13 }] },
  { name: "DMI", label: "DMI", pane: "sub", params: [{ label: "P1", defaultValue: 14 }, { label: "P2", defaultValue: 6 }], lines: [{ label: "PDI" }, { label: "MDI" }, { label: "ADX" }, { label: "ADXR" }] },
  { name: "ADX", label: "ADX — Sức mạnh xu hướng", pane: "sub", params: [{ label: "Chu kỳ", defaultValue: 14, min: 1, max: 100 }], lines: [{ label: "+DI" }, { label: "-DI" }, { label: "ADX" }] },
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

function getDefaultParams(indicator) {
  if (indicator.dynamicParams) {
    return indicator.defaultParams ?? indicator.params?.map((param) => param.defaultValue) ?? [];
  }
  return indicator.params?.map((param) => param.defaultValue) ?? [];
}

function getDynamicLineDefinitions(indicator, params = getDefaultParams(indicator)) {
  return params.map((period) => ({
    label: `${indicator.name}${period}`,
  }));
}

export function getIndicatorLineDefinitions(indicatorOrName, params) {
  const indicator =
    typeof indicatorOrName === "string"
      ? getIndicatorDefinition(indicatorOrName)
      : indicatorOrName;
  if (!indicator) return [];
  if (indicator.dynamicParams) return getDynamicLineDefinitions(indicator, params);
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

function buildDefaultLineConfig(indicator, params) {
  const lines = getIndicatorLineDefinitions(indicator, params);
  if (!lines.length) return {};
  return {
    styles: { lines: lines.map(defaultLineStyle) },
  };
}

function defaultFillStyle(fill) {
  return {
    label: fill.label,
    visible: true,
    colors: [...fill.colors],
  };
}

// Vùng nền (mây/fill) của chỉ báo — ví dụ mây Kumo của Ichimoku.
function buildDefaultFillConfig(indicator) {
  if (!indicator.fills?.length) return {};
  return { fills: indicator.fills.map(defaultFillStyle) };
}

export function buildDefaultIndicatorConfigs(definitions = ALL_INDICATORS) {
  return definitions.reduce((configs, indicator) => {
    const hasParams = indicator.params?.length;
    const params = getDefaultParams(indicator);
    const lineConfig = buildDefaultLineConfig(indicator, params);
    const fillConfig = buildDefaultFillConfig(indicator);
    const styles = { ...(lineConfig.styles ?? {}), ...fillConfig };
    configs[indicator.name] = {
      ...(hasParams
        ? { params }
        : {}),
      ...(Object.keys(styles).length ? { styles } : {}),
      display: { scopes: DISPLAY_SCOPES.map(defaultDisplayScope) },
    };
    return configs;
  }, {});
}

function asBool(value, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeColor(value, fallback) {
  const color = String(value).trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;

  const rgbaMatch = color.match(
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
  );
  if (!rgbaMatch) return fallback;

  const [red, green, blue] = rgbaMatch.slice(1, 4).map(Number);
  const alpha = Number(rgbaMatch[4]);
  const validRgb = [red, green, blue].every(
    (component) => Number.isInteger(component) && component >= 0 && component <= 255,
  );
  if (!validRgb || alpha < 0 || alpha > 1) return fallback;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function normalizeNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return fallback;
  return number;
}

function normalizeLineStyles(userLines = [], defaultLines = []) {
  return defaultLines.map((fallback, index) => {
    const user =
      userLines.find((line) => line?.label === fallback.label) ??
      userLines[index] ??
      {};
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

function normalizeFillStyles(userFills = [], defaultFills = []) {
  return defaultFills.map((fallback, index) => {
    const user =
      userFills.find((fill) => fill?.label === fallback.label) ??
      userFills[index] ??
      {};
    return {
      label: fallback.label,
      visible: asBool(user.visible, fallback.visible),
      colors: fallback.colors.map((fallbackColor, colorIndex) =>
        normalizeColor(user.colors?.[colorIndex], fallbackColor),
      ),
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

function normalizeDynamicParams(indicator, userParams, fallbackParams) {
  const param = indicator.params?.[0] ?? {};
  const min = param.min ?? 1;
  const max = param.max ?? 500;
  const unique = new Set();

  (Array.isArray(userParams) ? userParams : []).forEach((value) => {
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) return;
    unique.add(number);
  });

  const normalized = [...unique].sort((a, b) => a - b);
  return normalized.length ? normalized : fallbackParams;
}

export function normalizeIndicatorConfigs(configs = {}, definitions = ALL_INDICATORS) {
  const defaults = buildDefaultIndicatorConfigs(definitions);
  return definitions.reduce((normalized, indicator) => {
    const defaultConfig = defaults[indicator.name];
    if (!defaultConfig) return normalized;

    const userConfig = configs[indicator.name] ?? {};
    const nextConfig = {};
    // Tham số chỉ tái sử dụng khi cùng paramsVersion với định nghĩa hiện tại;
    // khác version = schema đã đổi ý nghĩa từng vị trí → bỏ, dùng mặc định.
    const sameParamsVersion =
      (indicator.paramsVersion ?? null) === (userConfig.paramsVersion ?? null);

    if (indicator.paramsVersion != null) {
      nextConfig.paramsVersion = indicator.paramsVersion;
    }

    if (indicator.dynamicParams) {
      nextConfig.params = normalizeDynamicParams(
        indicator,
        sameParamsVersion ? userConfig.params : [],
        defaultConfig.params,
      );
    } else if (indicator.params?.length) {
      const userParams = sameParamsVersion ? (userConfig.params ?? []) : [];
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

    const lineDefaults = indicator.dynamicParams
      ? buildDefaultLineConfig(indicator, nextConfig.params).styles?.lines
      : defaultConfig.styles?.lines;

    // Styles cũng gắn với schema: khác version thì bỏ như params, tránh style
    // dòng cũ (ghép theo vị trí) đè màu lên các dòng có ý nghĩa mới.
    const userStyles = sameParamsVersion ? userConfig.styles : undefined;
    const fillDefaults = defaultConfig.styles?.fills;
    if (lineDefaults?.length || fillDefaults?.length) {
      nextConfig.styles = {
        ...(lineDefaults?.length
          ? { lines: normalizeLineStyles(userStyles?.lines, lineDefaults) }
          : {}),
        ...(fillDefaults?.length
          ? { fills: normalizeFillStyles(userStyles?.fills, fillDefaults) }
          : {}),
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
