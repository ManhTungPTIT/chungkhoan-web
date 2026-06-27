import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_INDICATORS,
  buildDefaultIndicatorConfigs,
  normalizeIndicatorConfigs,
} from "../untils/indicatorSettings";
import {
  TbAdjustmentsHorizontal,
  TbEye,
  TbMathFunction,
  TbPalette,
  TbSettings,
  TbX,
} from "react-icons/tb";
import "../styles/IndicatorPicker.scss";

const TABS = [
  { key: "inputs", label: "Các đầu vào", Icon: TbAdjustmentsHorizontal },
  { key: "style", label: "Định dạng", Icon: TbPalette },
  { key: "display", label: "Hiển thị", Icon: TbEye },
];

const LINE_STYLES = [
  { value: "solid", label: "Liền" },
  { value: "dashed", label: "Đứt" },
];

function getIndicatorConfig(indicator, configs) {
  const defaults = buildDefaultIndicatorConfigs([indicator]);
  return normalizeIndicatorConfigs(
    {
      [indicator.name]: {
        ...defaults[indicator.name],
        ...(configs[indicator.name] ?? {}),
      },
    },
    [indicator],
  )[indicator.name];
}

function IndicatorEditor({
  indicator,
  configs,
  onClose,
  onSaveConfig,
}) {
  const [tab, setTab] = useState("inputs");
  const initialConfig = useMemo(
    () => getIndicatorConfig(indicator, configs),
    [indicator, configs],
  );
  const [draftConfig, setDraftConfig] = useState(initialConfig);
  const params = indicator.params ?? [];
  const styleLines = draftConfig?.styles?.lines ?? [];
  const displayScopes = draftConfig?.display?.scopes ?? [];
  const hasInputs = params.length > 0;
  const hasLines = styleLines.length > 0;
  const hasDisplayScopes = displayScopes.length > 0;

  useEffect(() => {
    setDraftConfig(initialConfig);
  }, [initialConfig]);

  useEffect(() => {
    if (tab === "inputs" && !hasInputs) setTab("style");
  }, [hasInputs, tab]);

  const updateParam = (index, value) => {
    setDraftConfig((current) => {
      const nextParams = [...(current.params ?? [])];
      nextParams[index] = value;
      return { ...current, params: nextParams };
    });
  };

  const updateLineStyle = (index, key, value) => {
    setDraftConfig((current) => {
      const lines = [...(current.styles?.lines ?? [])];
      lines[index] = { ...(lines[index] ?? {}), [key]: value };
      return { ...current, styles: { ...current.styles, lines } };
    });
  };

  const updateDisplayScope = (index, key, value) => {
    setDraftConfig((current) => {
      const scopes = [...(current.display?.scopes ?? [])];
      scopes[index] = { ...(scopes[index] ?? {}), [key]: value };
      return { ...current, display: { ...current.display, scopes } };
    });
  };

  const saveDraft = () => {
    const normalized = normalizeIndicatorConfigs(
      { [indicator.name]: draftConfig },
      [indicator],
    )[indicator.name];
    onSaveConfig?.(indicator.name, normalized);
    onClose();
  };

  return (
    <div className="indicator-editor__backdrop" onMouseDown={onClose}>
      <section
        aria-label={indicator.label}
        className="indicator-editor"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="indicator-editor__header">
          <h2>{indicator.label.split("—")[0].trim()}</h2>
          <button
            aria-label="Đóng"
            className="indicator-editor__icon-button"
            type="button"
            onClick={onClose}
          >
            <TbX />
          </button>
        </header>

        <div className="indicator-editor__tabs" role="tablist">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={tab === key ? "is-active" : ""}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="indicator-editor__body">
          {tab === "inputs" && (
            <div className="indicator-editor__grid indicator-editor__grid--inputs">
              {hasInputs ? (
                params.map((param, index) => (
                  <label
                    className="indicator-editor__field"
                    key={`${indicator.name}-${param.label}-${index}`}
                  >
                    <span>{param.label}</span>
                    <input
                      type="number"
                      value={draftConfig?.params?.[index] ?? param.defaultValue}
                      min={param.min ?? 1}
                      max={param.max ?? 500}
                      step={param.step ?? 1}
                      onChange={(event) => updateParam(index, event.target.value)}
                    />
                  </label>
                ))
              ) : (
                <p className="indicator-editor__empty">Chỉ báo này không có tham số đầu vào.</p>
              )}
            </div>
          )}

          {tab === "style" && (
            <div className="indicator-editor__rows">
              {hasLines ? (
                styleLines.map((line, index) => (
                  <div className="indicator-editor__style-row" key={`${line.label}-${index}`}>
                    <label className="indicator-editor__check">
                      <input
                        type="checkbox"
                        checked={line.visible}
                        onChange={(event) =>
                          updateLineStyle(
                            index,
                            "visible",
                            event.target.checked,
                          )
                        }
                      />
                      <span>{line.label}</span>
                    </label>
                    <label className="indicator-editor__swatch" title="Màu">
                      <input
                        aria-label={`${line.label} màu`}
                        type="color"
                        value={line.color}
                        onChange={(event) =>
                          updateLineStyle(
                            index,
                            "color",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <select
                      aria-label={`${line.label} kiểu nét`}
                      value={line.style}
                      onChange={(event) =>
                        updateLineStyle(
                          index,
                          "style",
                          event.target.value,
                        )
                      }
                    >
                      {LINE_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label={`${line.label} độ dày`}
                      type="number"
                      min="1"
                      max="6"
                      value={line.size}
                      onChange={(event) =>
                        updateLineStyle(
                          index,
                          "size",
                          event.target.value,
                        )
                      }
                    />
                    <span
                      className={`indicator-editor__preview indicator-editor__preview--${line.style}`}
                      style={{ color: line.color }}
                    />
                  </div>
                ))
              ) : (
                <p className="indicator-editor__empty">Chỉ báo này không có đường định dạng.</p>
              )}
            </div>
          )}

          {tab === "display" && (
            <div className="indicator-editor__rows">
              {hasDisplayScopes ? (
                displayScopes.map((scope, index) => (
                  <div className="indicator-editor__display-row" key={scope.key}>
                    <label className="indicator-editor__check">
                      <input
                        type="checkbox"
                        checked={scope.visible}
                        onChange={(event) =>
                          updateDisplayScope(
                            index,
                            "visible",
                            event.target.checked,
                          )
                        }
                      />
                      <span>{scope.label}</span>
                    </label>
                    <input
                      aria-label={`${scope.label} tối thiểu`}
                      type="number"
                      min="1"
                      max="500"
                      value={scope.min}
                      onChange={(event) =>
                        updateDisplayScope(
                          index,
                          "min",
                          event.target.value,
                        )
                      }
                    />
                    <input
                      aria-label={`${scope.label} thanh hiển thị`}
                      type="range"
                      min="1"
                      max="500"
                      value={scope.max}
                      onChange={(event) =>
                        updateDisplayScope(
                          index,
                          "max",
                          event.target.value,
                        )
                      }
                    />
                    <input
                      aria-label={`${scope.label} tối đa`}
                      type="number"
                      min="1"
                      max="500"
                      value={scope.max}
                      onChange={(event) =>
                        updateDisplayScope(
                          index,
                          "max",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="indicator-editor__empty">Chỉ báo này không có mục hiển thị riêng.</p>
              )}
            </div>
          )}
        </div>

        <footer className="indicator-editor__footer">
          <button
            className="indicator-editor__button indicator-editor__button--ghost"
            type="button"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="indicator-editor__button indicator-editor__button--primary"
            type="button"
            onClick={saveDraft}
          >
            Lưu
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function IndicatorPicker({
  active,
  configs = {},
  onToggle,
  onSaveConfig,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingName, setEditingName] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_INDICATORS;
    return ALL_INDICATORS.filter(
      (indicator) =>
        indicator.name.toLowerCase().includes(q) ||
        indicator.label.toLowerCase().includes(q),
    );
  }, [query]);

  const editingIndicator = editingName
    ? ALL_INDICATORS.find((indicator) => indicator.name === editingName)
    : null;

  return (
    <div ref={rootRef} className="indicator-picker" translate="no">
      <button
        className="indicator-picker__trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <TbMathFunction />
        Chỉ báo ▾
      </button>

      {open && (
        <div className="indicator-picker__menu">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm chỉ báo..."
            autoFocus
          />
          {filtered.length === 0 && (
            <div className="indicator-picker__empty">Không tìm thấy chỉ báo</div>
          )}
          {filtered.map((indicator) => {
            const isActive = !!active[indicator.name];
            return (
              <div className="indicator-picker__item" key={indicator.name}>
                <label>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggle(indicator.name)}
                  />
                  <span>{indicator.label}</span>
                </label>
                {isActive && (
                  <button
                    aria-label={`Chỉnh ${indicator.label.split("—")[0].trim()}`}
                    className="indicator-picker__settings"
                    type="button"
                    onClick={() => setEditingName(indicator.name)}
                  >
                    <TbSettings />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingIndicator && (
        <IndicatorEditor
          indicator={editingIndicator}
          configs={configs}
          onClose={() => setEditingName(null)}
          onSaveConfig={onSaveConfig}
        />
      )}
    </div>
  );
}
