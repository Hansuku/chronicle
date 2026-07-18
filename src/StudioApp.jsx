import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  CompassRose,
  Copy,
  Crosshair,
  DownloadSimple,
  FileArrowUp,
  FloppyDisk,
  MapPin,
  NotePencil,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { HistoricalWorldMap } from "./components/HistoricalWorldMap.jsx";
import {
  compactHistoricalEvent,
  createBlankEvent,
  createEventContent,
  EVENT_CONFIDENCE_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  HISTORICAL_EVENTS,
  normalizeHistoricalEvent,
  validateEventContent,
  validateHistoricalEvent,
} from "./data/eventContent.js";
import { formatHistoricalYear, getTerritoryLayer } from "./data/historicalTerritories.js";

const WORKSPACE_KEY = "earth-chronicle-studio-workspace-v1";
const DRAFT_KEY = "earth-chronicle-studio-draft-v1";
const DEFAULT_EVENT = HISTORICAL_EVENTS.find((event) => event.id === "cn-1644-beijing-fall")
  ?? createBlankEvent(1644);

function readStoredJson(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function initialWorkspace() {
  const stored = typeof window === "undefined" ? null : readStoredJson(WORKSPACE_KEY);
  const result = stored ? validateEventContent(stored) : null;
  return result?.valid ? result.events : HISTORICAL_EVENTS;
}

function initialDraft() {
  const stored = typeof window === "undefined" ? null : readStoredJson(DRAFT_KEY);
  return normalizeHistoricalEvent(stored ?? DEFAULT_EVENT);
}

function splitValues(value) {
  return [...new Set(String(value).split(/[，,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function valuesText(values, multiline = false) {
  return (values ?? []).join(multiline ? "\n" : "，");
}

function createSuggestedId(year, longitude, latitude) {
  const yearPart = Number.isInteger(Number(year)) ? String(year).replace("-", "bce-") : "year";
  const longitudePart = Number.isFinite(Number(longitude)) ? Math.abs(Math.round(Number(longitude) * 10)) : "x";
  const latitudePart = Number.isFinite(Number(latitude)) ? Math.abs(Math.round(Number(latitude) * 10)) : "y";
  return `event-${yearPart}-${longitudePart}-${latitudePart}`;
}

function contentFilename() {
  return "events.json";
}

export function StudioApp() {
  const [events, setEvents] = useState(initialWorkspace);
  const [draft, setDraft] = useState(initialDraft);
  const [pickerActive, setPickerActive] = useState(true);
  const [query, setQuery] = useState("");
  const [fileHandle, setFileHandle] = useState(null);
  const [notice, setNotice] = useState({ tone: "", text: "" });
  const importInputRef = useRef(null);

  const validation = useMemo(() => validateHistoricalEvent(draft), [draft]);
  const normalizedDraft = validation.value;
  const selectedYear = Number.isInteger(normalizedDraft.year) ? normalizedDraft.year : 1644;
  const previewId = normalizedDraft.id || "studio-draft-event";
  const previewEvent = { ...compactHistoricalEvent(normalizedDraft), id: previewId };
  const baseLayer = useMemo(() => getTerritoryLayer(selectedYear), [selectedYear]);
  const previewLayer = useMemo(() => ({
    ...baseLayer,
    stateKey: `${baseLayer.stateKey}:studio`,
    events: [
      ...baseLayer.events.filter((event) => event.id !== previewId && event.id !== draft.id),
      ...(Number.isFinite(previewEvent.coordinates[0]) && Number.isFinite(previewEvent.coordinates[1])
        ? [previewEvent]
        : []),
    ],
  }), [baseLayer, draft.id, previewEvent]);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return [...events]
      .filter((event) => !normalized || `${event.name}${event.location}${event.year}${event.tags?.join("") ?? ""}`
        .toLocaleLowerCase().includes(normalized))
      .sort((left, right) => right.year - left.year || left.name.localeCompare(right.name));
  }, [events, query]);

  const currentJson = useMemo(
    () => JSON.stringify(compactHistoricalEvent(normalizedDraft), null, 2),
    [normalizedDraft],
  );

  function updateField(key, value) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
    setNotice({ tone: "", text: "" });
  }

  function updateCoordinates(coordinates) {
    updateField("coordinates", coordinates);
  }

  function commitDraft() {
    if (!validation.valid) {
      setNotice({ tone: "error", text: "请先处理表单中的必填项和格式错误。" });
      return null;
    }
    const nextEvent = compactHistoricalEvent(normalizedDraft);
    const nextEvents = [...events.filter((event) => event.id !== nextEvent.id), nextEvent]
      .sort((left, right) => left.year - right.year || left.id.localeCompare(right.id));
    const content = createEventContent(nextEvents);
    setEvents(nextEvents);
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(content));
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextEvent));
    setNotice({ tone: "success", text: `“${nextEvent.name}”已保存到本次编辑内容库。` });
    return content;
  }

  function newEvent() {
    const blank = createBlankEvent(selectedYear);
    blank.id = createSuggestedId(blank.year, blank.coordinates[0], blank.coordinates[1]);
    setDraft(blank);
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(blank));
    setNotice({ tone: "", text: "" });
  }

  function editEvent(event) {
    const next = normalizeHistoricalEvent(event);
    setDraft(next);
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    setNotice({ tone: "", text: "" });
  }

  function removeEvent() {
    if (!draft.id || !events.some((event) => event.id === draft.id)) return;
    if (!window.confirm(`从本次编辑内容库中移除“${draft.name || draft.id}”？`)) return;
    const nextEvents = events.filter((event) => event.id !== draft.id);
    const content = createEventContent(nextEvents);
    setEvents(nextEvents);
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(content));
    newEvent();
    setNotice({ tone: "success", text: "事件已从本次编辑内容库移除；保存内容文件后才会写入磁盘。" });
  }

  function applyImportedContent(content, label) {
    const result = validateEventContent(content);
    if (!result.valid) {
      setNotice({ tone: "error", text: `无法读取${label}：${result.errors.slice(0, 2).join("；")}` });
      return false;
    }
    setEvents(result.events);
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(createEventContent(result.events)));
    const preferred = result.events.find((event) => event.id === draft.id) ?? result.events[0];
    if (preferred) editEvent(preferred);
    setNotice({ tone: "success", text: `已载入${label}，共 ${result.events.length} 条事件。` });
    return true;
  }

  async function importFile(file) {
    if (!file) return;
    try {
      const content = JSON.parse(await file.text());
      applyImportedContent(content, `“${file.name}”`);
    } catch {
      setNotice({ tone: "error", text: "导入失败：文件不是有效的 JSON。" });
    }
  }

  async function connectContentFile() {
    if (!("showOpenFilePicker" in window)) {
      importInputRef.current?.click();
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "地球编年史事件内容包", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const content = JSON.parse(await file.text());
      if (applyImportedContent(content, `“${file.name}”`)) setFileHandle(handle);
    } catch (error) {
      if (error?.name !== "AbortError") setNotice({ tone: "error", text: "连接内容文件失败，请检查文件格式。" });
    }
  }

  function downloadContent(content) {
    const blob = new Blob([`${JSON.stringify(content, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = contentFilename();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function saveContentFile() {
    const content = commitDraft();
    if (!content) return;
    try {
      let handle = fileHandle;
      if (!handle && "showSaveFilePicker" in window) {
        handle = await window.showSaveFilePicker({
          suggestedName: contentFilename(),
          types: [{ description: "地球编年史事件内容包", accept: { "application/json": [".json"] } }],
        });
        setFileHandle(handle);
      }
      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(`${JSON.stringify(content, null, 2)}\n`);
        await writable.close();
        setNotice({ tone: "success", text: "事件内容文件已保存。开发环境会自动刷新地图数据。" });
      } else {
        downloadContent(content);
        setNotice({ tone: "success", text: "内容包已下载，请用它替换项目中的 content/events.json。" });
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setNotice({ tone: "error", text: "未能写入文件，已保留浏览器中的编辑内容。" });
      }
    }
  }

  async function copyCurrentJson() {
    try {
      await navigator.clipboard.writeText(currentJson);
      setNotice({ tone: "success", text: "当前事件 JSON 已复制。" });
    } catch {
      setNotice({ tone: "error", text: "浏览器未允许复制，请直接从右侧 JSON 预览中选择。" });
    }
  }

  return (
    <main className="studio-app">
      <header className="studio-topbar">
        <a className="studio-brand" href="/" aria-label="返回地球编年史">
          <CompassRose size={34} weight="thin" aria-hidden="true" />
          <span><strong>地球编年史</strong><small>人工标注台</small></span>
        </a>
        <div className="studio-heading">
          <span>EDITORIAL CARTOGRAPHY</span>
          <strong>历史事件内容工作台</strong>
        </div>
        <div className="studio-top-actions">
          <button type="button" onClick={connectContentFile}>
            <FileArrowUp size={17} aria-hidden="true" />连接内容文件
          </button>
          <button type="button" className="is-primary" onClick={saveContentFile}>
            <FloppyDisk size={17} weight="fill" aria-hidden="true" />保存内容文件
          </button>
          <a href="/"><ArrowLeft size={16} aria-hidden="true" />返回地图</a>
        </div>
      </header>

      <section className="studio-shell">
        <aside className="studio-form-panel">
          <header className="studio-panel-heading">
            <div><span>01 · EVENT RECORD</span><strong>事件记录</strong></div>
            <button type="button" onClick={newEvent}><Plus size={16} weight="bold" />新建</button>
          </header>

          <div className="studio-form-scroll">
            <div className="studio-field-row is-three">
              <label>
                <span>年份 *</span>
                <input
                  type="number"
                  min="-3400"
                  max="2026"
                  step="1"
                  value={Number.isFinite(Number(draft.year)) ? draft.year : ""}
                  onChange={(event) => updateField("year", event.target.value === "" ? "" : Number(event.target.value))}
                />
              </label>
              <label>
                <span>日期原文</span>
                <input value={draft.dateText} onChange={(event) => updateField("dateText", event.target.value)} placeholder="如：三月十九日" />
              </label>
              <label>
                <span>历法</span>
                <input value={draft.calendar} onChange={(event) => updateField("calendar", event.target.value)} placeholder="如：农历" />
              </label>
            </div>

            <label className="studio-field">
              <span>事件标题 *</span>
              <input value={draft.name} onChange={(event) => updateField("name", event.target.value)} placeholder="例如：李自成攻入北京" />
            </label>

            <label className="studio-field">
              <span>事件编号 *</span>
              <div className="studio-input-action">
                <input value={draft.id} onChange={(event) => updateField("id", event.target.value.toLowerCase())} placeholder="cn-1644-beijing-fall" />
                <button type="button" onClick={() => updateField("id", createSuggestedId(draft.year, draft.coordinates[0], draft.coordinates[1]))}>生成</button>
              </div>
              <small>只使用小写字母、数字与连字符；编号用于更新和去重。</small>
            </label>

            <div className="studio-field-row">
              <label>
                <span>地点 *</span>
                <input value={draft.location} onChange={(event) => updateField("location", event.target.value)} placeholder="北京" />
              </label>
              <label>
                <span>事件类型 *</span>
                <select value={draft.type} onChange={(event) => updateField("type", event.target.value)}>
                  {EVENT_TYPES.map((type) => <option value={type} key={type}>{EVENT_TYPE_LABELS[type]}</option>)}
                </select>
              </label>
            </div>

            <label className="studio-field">
              <span>事件说明 *</span>
              <textarea rows="4" value={draft.detail} onChange={(event) => updateField("detail", event.target.value)} placeholder="说明发生了什么，以及它为何重要。" />
            </label>

            <div className="studio-coordinate-fields">
              <div>
                <span>地图坐标 *</span>
                <small>点击地图落点，或直接拖动琥珀色图钉。</small>
              </div>
              <label><span>经度</span><input type="number" step="0.0001" value={draft.coordinates[0]} onChange={(event) => updateCoordinates([event.target.value, draft.coordinates[1]])} /></label>
              <label><span>纬度</span><input type="number" step="0.0001" value={draft.coordinates[1]} onChange={(event) => updateCoordinates([draft.coordinates[0], event.target.value])} /></label>
            </div>

            <div className="studio-field-row">
              <label>
                <span>相关政权</span>
                <input value={valuesText(draft.relatedPolities)} onChange={(event) => updateField("relatedPolities", splitValues(event.target.value))} placeholder="ming，dashun" />
              </label>
              <label>
                <span>标签</span>
                <input value={valuesText(draft.tags)} onChange={(event) => updateField("tags", splitValues(event.target.value))} placeholder="明清鼎革，北京" />
              </label>
            </div>

            <div className="studio-field-row">
              <label>
                <span>可信度</span>
                <select value={draft.confidence} onChange={(event) => updateField("confidence", event.target.value)}>
                  {Object.entries(EVENT_CONFIDENCE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>来源</span>
                <textarea rows="2" value={valuesText(draft.sources, true)} onChange={(event) => updateField("sources", splitValues(event.target.value))} placeholder="每行一条书目或网址" />
              </label>
            </div>

            <label className="studio-field">
              <span>编辑备注</span>
              <textarea rows="3" value={draft.editorialNote} onChange={(event) => updateField("editorialNote", event.target.value)} placeholder="记录口径、歧义或尚待核实的问题，不直接展示在地图事件卡中。" />
            </label>
          </div>

          <footer className="studio-form-actions">
            <button type="button" className="is-primary" onClick={commitDraft}><FloppyDisk size={17} weight="fill" />保存事件</button>
            <button type="button" onClick={copyCurrentJson}><Copy size={17} />复制 JSON</button>
            <button type="button" className="is-danger" onClick={removeEvent} disabled={!events.some((event) => event.id === draft.id)}><Trash size={17} />移除</button>
          </footer>
        </aside>

        <section className="studio-map-panel">
          <header className="studio-map-heading">
            <div>
              <span>02 · GEOGRAPHIC ANNOTATION</span>
              <strong>{formatHistoricalYear(selectedYear)} · {baseLayer.title}</strong>
              <small>疆域仅作为时代背景；事件图钉的位置由你独立标注。</small>
            </div>
            <button type="button" className={pickerActive ? "is-active" : ""} onClick={() => setPickerActive((value) => !value)} aria-pressed={pickerActive}>
              <Crosshair size={18} weight={pickerActive ? "bold" : "regular"} />
              {pickerActive ? "落点模式已开启" : "开启落点模式"}
            </button>
          </header>
          <div className="studio-map-stage">
            <HistoricalWorldMap
              layer={previewLayer}
              activeGroupId=""
              activeEventId={previewId}
              layers={{ colonies: true, events: true, metrics: false }}
              onSelectGroup={() => {}}
              onSelectEvent={() => {}}
              onClearEvent={() => {}}
              coordinatePickerActive={pickerActive}
              editableEventId={previewId}
              onPickCoordinates={updateCoordinates}
              onMoveEditableEvent={updateCoordinates}
            />
          </div>
          <footer className="studio-map-readout">
            <span><MapPin size={16} weight="fill" />经度 {Number(normalizedDraft.coordinates[0]).toFixed(4)}</span>
            <span>纬度 {Number(normalizedDraft.coordinates[1]).toFixed(4)}</span>
            <em>地图点击选点 · 图钉拖动微调 · 滚轮缩放</em>
          </footer>
        </section>

        <aside className="studio-review-panel">
          <section className="studio-validation">
            <header className="studio-panel-heading">
              <div><span>03 · REVIEW</span><strong>校验与预览</strong></div>
              {validation.valid
                ? <CheckCircle size={22} weight="fill" className="is-valid" aria-label="校验通过" />
                : <WarningCircle size={22} weight="fill" className="is-invalid" aria-label="存在错误" />}
            </header>
            {validation.errors.length ? (
              <ul className="studio-errors">{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
            ) : <p className="studio-valid-message">结构校验通过，可以保存到内容库。</p>}
            {validation.warnings.length ? (
              <ul className="studio-warnings">{validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            ) : null}
          </section>

          {notice.text ? <div className={`studio-notice is-${notice.tone}`} role="status">{notice.text}</div> : null}

          <section className="studio-event-preview">
            <span>{normalizedDraft.dateText || formatHistoricalYear(selectedYear)} · {EVENT_TYPE_LABELS[normalizedDraft.type]}</span>
            <strong>{normalizedDraft.name || "未命名事件"}</strong>
            <small><MapPin size={13} weight="fill" />{normalizedDraft.location || "尚未填写地点"}</small>
            <p>{normalizedDraft.detail || "事件说明会在这里预览。"}</p>
            {normalizedDraft.editorialNote ? <em>编辑备注：{normalizedDraft.editorialNote}</em> : null}
          </section>

          <section className="studio-json-preview">
            <header><span>当前事件 JSON</span><button type="button" onClick={copyCurrentJson}><Copy size={14} />复制</button></header>
            <pre>{currentJson}</pre>
          </section>

          <section className="studio-library">
            <header>
              <div><NotePencil size={16} /><strong>事件内容库</strong><span>{events.length}</span></div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选年份、地点或标题" aria-label="筛选事件内容库" />
            </header>
            <div className="studio-library-list">
              {filteredEvents.map((event) => (
                <button type="button" key={event.id} className={event.id === draft.id ? "is-active" : ""} onClick={() => editEvent(event)}>
                  <span>{formatHistoricalYear(event.year)}</span>
                  <strong>{event.name}</strong>
                  <small>{event.location}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          importFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <footer className="studio-footer">
        <span><DownloadSimple size={15} />数据源：content/events.json</span>
        <p>人工标注只描述事件；疆域变更仍应作为独立历史状态维护。</p>
      </footer>
    </main>
  );
}
