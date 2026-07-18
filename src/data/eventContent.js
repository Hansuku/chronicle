import eventContent from "../../content/events.json" with { type: "json" };

export const EVENT_TYPES = ["state", "technology", "trade", "writing", "culture"];
export const EVENT_TYPE_LABELS = {
  state: "政权与战争",
  technology: "科技与生产",
  trade: "贸易与交通",
  writing: "文字与知识",
  culture: "文化与社会",
};
export const EVENT_CONFIDENCE_LABELS = {
  high: "较高",
  medium: "一般",
  low: "待核实",
};
export const EVENT_YEAR_MIN = -3400;
export const EVENT_YEAR_MAX = 2026;
export const EVENT_CONTENT_VERSION = 1;

function isFilledString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function numericValue(value) {
  if (value === "" || value == null) return Number.NaN;
  return Number(value);
}

export function createBlankEvent(year = 1644) {
  return {
    id: "",
    name: "",
    year: Number.isInteger(Number(year)) ? Number(year) : 1644,
    dateText: "",
    calendar: "",
    location: "",
    detail: "",
    coordinates: [116.4074, 39.9042],
    type: "state",
    relatedPolities: [],
    tags: [],
    sources: [],
    confidence: "medium",
    editorialNote: "",
  };
}

export function normalizeHistoricalEvent(event) {
  const coordinates = Array.isArray(event?.coordinates) ? event.coordinates : [];
  return {
    ...createBlankEvent(event?.year),
    ...event,
    id: String(event?.id ?? "").trim(),
    name: String(event?.name ?? "").trim(),
    year: numericValue(event?.year),
    dateText: String(event?.dateText ?? "").trim(),
    calendar: String(event?.calendar ?? "").trim(),
    location: String(event?.location ?? "").trim(),
    detail: String(event?.detail ?? "").trim(),
    coordinates: [numericValue(coordinates[0]), numericValue(coordinates[1])],
    type: String(event?.type ?? "state"),
    relatedPolities: uniqueStrings(event?.relatedPolities),
    tags: uniqueStrings(event?.tags),
    sources: uniqueStrings(event?.sources),
    confidence: String(event?.confidence ?? "medium"),
    editorialNote: String(event?.editorialNote ?? "").trim(),
  };
}

export function compactHistoricalEvent(event) {
  const normalized = normalizeHistoricalEvent(event);
  const compact = {
    id: normalized.id,
    name: normalized.name,
    year: normalized.year,
    location: normalized.location,
    detail: normalized.detail,
    coordinates: normalized.coordinates.map((value) => Number(value.toFixed(4))),
    type: normalized.type,
  };
  for (const key of ["dateText", "calendar", "editorialNote"]) {
    if (normalized[key]) compact[key] = normalized[key];
  }
  for (const key of ["relatedPolities", "tags", "sources"]) {
    if (normalized[key].length) compact[key] = normalized[key];
  }
  if (normalized.confidence) compact.confidence = normalized.confidence;
  return compact;
}

export function validateHistoricalEvent(event) {
  const value = normalizeHistoricalEvent(event);
  const errors = [];
  const warnings = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value.id)) {
    errors.push("事件编号只能使用小写字母、数字和连字符。");
  }
  if (!isFilledString(value.name)) errors.push("请填写事件标题。");
  if (!Number.isInteger(value.year)) errors.push("年份必须是整数。");
  else if (value.year < EVENT_YEAR_MIN || value.year > EVENT_YEAR_MAX) {
    errors.push(`年份必须位于 ${EVENT_YEAR_MIN} 至 ${EVENT_YEAR_MAX} 之间。`);
  }
  if (!isFilledString(value.location)) errors.push("请填写地点名称。");
  if (!isFilledString(value.detail)) errors.push("请填写事件说明。");
  if (!EVENT_TYPES.includes(value.type)) errors.push("请选择有效的事件分类。");
  const [longitude, latitude] = value.coordinates;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push("经度必须位于 -180 至 180 之间。");
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push("纬度必须位于 -90 至 90 之间。");
  }
  if (!Object.hasOwn(EVENT_CONFIDENCE_LABELS, value.confidence)) {
    errors.push("请选择有效的可信度。");
  }
  if (!value.sources.length) warnings.push("尚未添加史料来源，发布前建议补充。");
  if (!value.dateText) warnings.push("尚未填写具体日期；事件仍会按年份准确显示。");
  return { value, errors, warnings, valid: errors.length === 0 };
}

export function validateEventContent(content) {
  const errors = [];
  const warnings = [];
  if (!content || typeof content !== "object") {
    return { valid: false, errors: ["内容包必须是 JSON 对象。"], warnings, events: [] };
  }
  if (content.version !== EVENT_CONTENT_VERSION) {
    errors.push(`内容包版本必须为 ${EVENT_CONTENT_VERSION}。`);
  }
  if (!Array.isArray(content.events)) {
    errors.push("内容包缺少 events 数组。");
    return { valid: false, errors, warnings, events: [] };
  }
  const ids = new Set();
  const events = content.events.map((event, index) => {
    const result = validateHistoricalEvent(event);
    result.errors.forEach((message) => errors.push(`第 ${index + 1} 条：${message}`));
    result.warnings.forEach((message) => warnings.push(`${result.value.name || `第 ${index + 1} 条`}：${message}`));
    if (ids.has(result.value.id)) errors.push(`事件编号重复：${result.value.id}`);
    ids.add(result.value.id);
    return compactHistoricalEvent(result.value);
  });
  return { valid: errors.length === 0, errors, warnings, events };
}

export function createEventContent(events) {
  return {
    $schema: "./events.schema.json",
    version: EVENT_CONTENT_VERSION,
    events: [...events]
      .map(compactHistoricalEvent)
      .sort((left, right) => left.year - right.year || left.id.localeCompare(right.id)),
  };
}

export const HISTORICAL_EVENT_CONTENT = createEventContent(eventContent.events);
export const HISTORICAL_EVENTS = HISTORICAL_EVENT_CONTENT.events;

export function getHistoricalEventsForYear(year) {
  const value = Number(year);
  if (!Number.isInteger(value)) return [];
  return HISTORICAL_EVENTS.filter((event) => event.year === value);
}
