import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnchorSimple,
  ArrowsLeftRight,
  Atom,
  Bank,
  CaretLeft,
  CaretRight,
  ChartBar,
  CompassRose,
  Factory,
  FlagBanner,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapTrifold,
  Pause,
  Play,
  Sparkle,
  UsersThree,
  X,
  Coins,
} from "@phosphor-icons/react";
import { HistoricalWorldMap } from "./components/HistoricalWorldMap.jsx";
import {
  formatHistoricalYear,
  getTerritoryLayer,
  matchesHistoricalGroup,
  TERRITORY_ANCHORS,
} from "./data/historicalTerritories.js";

const TIMELINE_MAX = 1000;
const TIMELINE_VISIBLE_SPAN = 1100;
const TIMELINE_ANCHOR_POSITIONS = [0, 130, 230, 340, 440, 530, 820, 900, 1000];
const TIMELINE_TICKS = Array.from({ length: 101 }, (_, index) => index * 10);

const dimensions = [
  { key: "technology", label: "科技", Icon: Atom },
  { key: "economy", label: "经济", Icon: Coins },
  { key: "society", label: "社会", Icon: UsersThree },
  { key: "belief", label: "信仰", Icon: Bank },
];

function positionToYear(position) {
  const bounded = Math.max(0, Math.min(TIMELINE_MAX, Number(position)));
  let lowerIndex = TIMELINE_ANCHOR_POSITIONS.length - 2;
  for (let index = 0; index < TIMELINE_ANCHOR_POSITIONS.length - 1; index += 1) {
    if (bounded <= TIMELINE_ANCHOR_POSITIONS[index + 1]) {
      lowerIndex = index;
      break;
    }
  }
  const lowerPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex];
  const upperPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex + 1];
  const progress = (bounded - lowerPosition) / (upperPosition - lowerPosition);
  const lowerYear = TERRITORY_ANCHORS[lowerIndex].year;
  const upperYear = TERRITORY_ANCHORS[lowerIndex + 1].year;
  return Math.round(lowerYear + (upperYear - lowerYear) * progress);
}

function yearToPosition(year) {
  const bounded = Math.max(
    TERRITORY_ANCHORS[0].year,
    Math.min(TERRITORY_ANCHORS.at(-1).year, Number(year)),
  );
  let lowerIndex = 0;
  for (let index = 0; index < TERRITORY_ANCHORS.length - 1; index += 1) {
    if (bounded <= TERRITORY_ANCHORS[index + 1].year) {
      lowerIndex = index;
      break;
    }
  }
  const lowerYear = TERRITORY_ANCHORS[lowerIndex].year;
  const upperYear = TERRITORY_ANCHORS[lowerIndex + 1].year;
  const progress = (bounded - lowerYear) / (upperYear - lowerYear);
  return TIMELINE_ANCHOR_POSITIONS[lowerIndex]
    + progress * (TIMELINE_ANCHOR_POSITIONS[lowerIndex + 1] - TIMELINE_ANCHOR_POSITIONS[lowerIndex]);
}

function formatDialYear(year) {
  return year < 0 ? `前${Math.abs(year)}` : String(year);
}

function yearText(year) {
  return year < 0 ? `公元前 ${Math.abs(year)}` : `${year}`;
}

export function App() {
  const [timelinePosition, setTimelinePosition] = useState(() => yearToPosition(1785));
  const [playing, setPlaying] = useState(false);
  const [viewMode, setViewMode] = useState("territory");
  const [mapLayers, setMapLayers] = useState({ colonies: true, events: true, metrics: false });
  const [activeGroupId, setActiveGroupId] = useState("britain");
  const [activeEventId, setActiveEventId] = useState("london-steam");
  const [comparisonIds, setComparisonIds] = useState(["britain", "qing"]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [timelineDragging, setTimelineDragging] = useState(false);
  const timelineTrackRef = useRef(null);
  const timelineDragRef = useRef(null);
  const animationRef = useRef(0);

  const year = positionToYear(timelinePosition);
  const territoryLayer = useMemo(() => getTerritoryLayer(year), [year]);

  useEffect(() => {
    const ids = new Set(territoryLayer.comparisons.map((item) => item.id));
    setComparisonIds((current) => {
      const retained = current.filter((id) => ids.has(id));
      const next = [...retained];
      for (const item of territoryLayer.comparisons) {
        if (next.length >= 2) break;
        if (!next.includes(item.id)) next.push(item.id);
      }
      return next.slice(0, 2);
    });
    setActiveGroupId(territoryLayer.groups[0]?.id ?? "");
    setActiveEventId(territoryLayer.events[0]?.id ?? "");
  }, [territoryLayer.year]);

  useEffect(() => {
    if (!playing) return undefined;
    let previous = performance.now();
    let frame = 0;
    const tick = (now) => {
      const delta = Math.min(64, now - previous);
      previous = now;
      setTimelinePosition((current) => {
        const next = current + delta * 0.018;
        if (next >= TIMELINE_MAX) {
          setPlaying(false);
          return TIMELINE_MAX;
        }
        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => () => window.cancelAnimationFrame(animationRef.current), []);

  const animateToPosition = useCallback((target) => {
    window.cancelAnimationFrame(animationRef.current);
    setPlaying(false);
    const from = timelinePosition;
    const to = Math.max(0, Math.min(TIMELINE_MAX, target));
    const startedAt = performance.now();
    const duration = Math.min(1100, 420 + Math.abs(to - from) * 0.7);
    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setTimelinePosition(from + (to - from) * eased);
      if (progress < 1) animationRef.current = window.requestAnimationFrame(animate);
    };
    animationRef.current = window.requestAnimationFrame(animate);
  }, [timelinePosition]);

  function beginTimelineDrag(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    const bounds = timelineTrackRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    window.cancelAnimationFrame(animationRef.current);
    setPlaying(false);
    timelineDragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      position: timelinePosition,
      width: bounds.width,
    };
    setTimelineDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continueTimelineDrag(event) {
    const start = timelineDragRef.current;
    if (!start) return;
    const delta = event.clientX - start.clientX;
    const next = start.position - (delta / start.width) * TIMELINE_VISIBLE_SPAN;
    setTimelinePosition(Math.max(0, Math.min(TIMELINE_MAX, next)));
  }

  function endTimelineDrag(event) {
    if (!timelineDragRef.current) return;
    continueTimelineDrag(event);
    timelineDragRef.current = null;
    setTimelineDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTimelineKeyDown(event) {
    let nextYear = year;
    const step = event.shiftKey ? 25 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextYear -= step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") nextYear += step;
    else if (event.key === "PageDown") nextYear -= 100;
    else if (event.key === "PageUp") nextYear += 100;
    else if (event.key === "Home") nextYear = TERRITORY_ANCHORS[0].year;
    else if (event.key === "End") nextYear = TERRITORY_ANCHORS.at(-1).year;
    else return;
    event.preventDefault();
    setPlaying(false);
    setTimelinePosition(yearToPosition(nextYear));
  }

  function stepEra(direction) {
    const nearestIndex = TERRITORY_ANCHORS.reduce((best, anchor, index) => (
      Math.abs(anchor.year - year) < Math.abs(TERRITORY_ANCHORS[best].year - year) ? index : best
    ), 0);
    const nextIndex = Math.max(0, Math.min(TERRITORY_ANCHORS.length - 1, nearestIndex + direction));
    animateToPosition(TIMELINE_ANCHOR_POSITIONS[nextIndex]);
  }

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    const groupResults = territoryLayer.groups
      .filter((group) => matchesHistoricalGroup(group, normalized))
      .slice(0, 5)
      .map((group) => ({ type: "group", id: group.id, title: group.name, subtitle: "国家或历史政权" }));
    const eventResults = territoryLayer.events
      .filter((event) => `${event.name}${event.location}${event.detail}`.toLocaleLowerCase().includes(normalized))
      .slice(0, 4)
      .map((event) => ({ type: "event", id: event.id, title: event.name, subtitle: event.location }));
    return [...groupResults, ...eventResults];
  }, [query, territoryLayer]);

  function selectSearchResult(result) {
    if (result.type === "group") setActiveGroupId(result.id);
    else setActiveEventId(result.id);
    setQuery(result.title);
    setSearchOpen(false);
  }

  function toggleComparison(id) {
    setComparisonIds((current) => {
      if (current.includes(id)) return current;
      return [current[1] ?? current[0], id].filter(Boolean).slice(-2);
    });
  }

  function swapComparisons() {
    setComparisonIds(([first, second]) => [second, first]);
  }

  const selectedComparisons = comparisonIds.map((id) => (
    territoryLayer.comparisons.find((item) => item.id === id)
  )).filter(Boolean);
  const primaryComparison = selectedComparisons[0] ?? territoryLayer.comparisons[0];
  const secondaryComparison = selectedComparisons[1] ?? territoryLayer.comparisons[1];
  const placeOnRail = (position) => 50 + ((position - timelinePosition) / TIMELINE_VISIBLE_SPAN) * 100;

  return (
    <main className={`chronicle-app ${viewMode === "compare" ? "is-comparing" : ""}`} id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="地球编年史首页">
          <CompassRose size={36} weight="thin" aria-hidden="true" />
          <span>
            <strong>地球编年史</strong>
            <small>文明疆域图</small>
          </span>
        </a>

        <form className="search" role="search" onSubmit={(event) => {
          event.preventDefault();
          if (searchResults[0]) selectSearchResult(searchResults[0]);
        }}>
          <MagnifyingGlass size={18} aria-hidden="true" />
          <input
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="搜索国家、政权或历史事件"
            aria-label="搜索国家、政权或历史事件"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
          {searchOpen && query ? (
            <div className="search-popover" role="listbox" aria-label="搜索结果">
              {searchResults.length ? searchResults.map((result) => (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  key={`${result.type}-${result.id}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSearchResult(result)}
                >
                  {result.type === "group" ? <FlagBanner size={16} aria-hidden="true" /> : <Sparkle size={16} aria-hidden="true" />}
                  <span><strong>{result.title}</strong><small>{result.subtitle}</small></span>
                </button>
              )) : <p>当前年代没有匹配内容，拖动时间轴切换时期再搜索。</p>}
            </div>
          ) : null}
        </form>

        <div className="mode-switch" aria-label="视图模式">
          <button
            type="button"
            className={viewMode === "territory" ? "is-active" : ""}
            onClick={() => setViewMode("territory")}
            aria-pressed={viewMode === "territory"}
          >
            <GlobeHemisphereWest size={17} aria-hidden="true" />
            疆域地图
          </button>
          <button
            type="button"
            className={viewMode === "compare" ? "is-active" : ""}
            onClick={() => setViewMode("compare")}
            aria-pressed={viewMode === "compare"}
          >
            <ArrowsLeftRight size={17} aria-hidden="true" />
            文明对照
          </button>
        </div>
      </header>

      <section className="atlas-workspace" aria-label="全球历史疆域地图">
        <aside className="map-toolbar" aria-label="地图图层">
          <button type="button" className="is-active" aria-pressed="true">
            <MapTrifold size={20} weight="fill" aria-hidden="true" />
            <span>疆域</span>
          </button>
          <button
            type="button"
            className={mapLayers.colonies ? "is-active" : ""}
            onClick={() => setMapLayers((current) => ({ ...current, colonies: !current.colonies }))}
            aria-pressed={mapLayers.colonies}
          >
            <FlagBanner size={20} aria-hidden="true" />
            <span>殖民地</span>
          </button>
          <button
            type="button"
            className={mapLayers.events ? "is-active" : ""}
            onClick={() => setMapLayers((current) => ({ ...current, events: !current.events }))}
            aria-pressed={mapLayers.events}
          >
            <Sparkle size={20} aria-hidden="true" />
            <span>事件</span>
          </button>
          <button
            type="button"
            className={mapLayers.metrics ? "is-active" : ""}
            onClick={() => setMapLayers((current) => ({ ...current, metrics: !current.metrics }))}
            aria-pressed={mapLayers.metrics}
          >
            <ChartBar size={20} aria-hidden="true" />
            <span>文明指标</span>
          </button>
        </aside>

        <section className="map-panel">
          <header className="map-period-heading">
            <span>{formatHistoricalYear(territoryLayer.year)} · 全球疆域</span>
            <strong>{territoryLayer.title}</strong>
            <small>拖动时间轴，全球政权边界、名称与势力范围同步演变</small>
          </header>

          <HistoricalWorldMap
            layer={territoryLayer}
            activeGroupId={activeGroupId}
            activeEventId={activeEventId}
            layers={mapLayers}
            onSelectGroup={(group) => {
              setActiveGroupId(group.id);
              setActiveEventId("");
            }}
            onSelectEvent={(event) => {
              setActiveEventId((current) => current === event.id ? "" : event.id);
              setActiveGroupId("");
            }}
          />

          <div className="map-legend" aria-label="地图图例">
            <strong>图例</strong>
            <span><i className="legend-solid" /> 主权国家 / 帝国领土</span>
            <span><i className="legend-hatch" /> 殖民地 / 属地</span>
            <span><i className="legend-dotted" /> 争议或未定边界</span>
            <span><i className="legend-ring" /> 势力范围 / 文化影响</span>
          </div>
        </section>

        <aside className="global-brief" aria-live="polite">
          <header>
            <span>全球态势 · {yearText(territoryLayer.year)}</span>
            <CompassRose size={22} weight="thin" aria-hidden="true" />
          </header>
          <p>{territoryLayer.subtitle}</p>
          <div className="brief-items" key={territoryLayer.year}>
            {territoryLayer.insights.map(([region, title, detail], index) => (
              <button type="button" key={`${region}-${title}`} onClick={() => setViewMode("compare")}>
                <i>{index + 1}</i>
                <span><small>{region}</small><strong>{title}</strong><em>{detail}</em></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="timeline-control" aria-label="连续历史时间轴">
          <div className="timeline-summary">
            <span>{territoryLayer.range}</span>
            <strong>{territoryLayer.title}</strong>
          </div>
          <div
            ref={timelineTrackRef}
            className={`timeline-track ${timelineDragging ? "is-dragging" : ""}`}
            onPointerDown={beginTimelineDrag}
            onPointerMove={continueTimelineDrag}
            onPointerUp={endTimelineDrag}
            onPointerCancel={endTimelineDrag}
            onKeyDown={handleTimelineKeyDown}
            role="slider"
            tabIndex="0"
            aria-label="历史年代尺，左右拖动整条时间轴选择年份"
            aria-valuemin={TERRITORY_ANCHORS[0].year}
            aria-valuemax={TERRITORY_ANCHORS.at(-1).year}
            aria-valuenow={year}
            aria-valuetext={formatHistoricalYear(year)}
          >
            <div className="timeline-moving-rail" aria-hidden="true">
              {TIMELINE_TICKS.map((position, index) => {
                const left = placeOnRail(position);
                if (left < -2 || left > 102) return null;
                return <i key={position} className={index % 10 === 0 ? "is-major" : ""} style={{ left: `${left}%` }} />;
              })}
              {TERRITORY_ANCHORS.map((anchor, index) => {
                const left = placeOnRail(TIMELINE_ANCHOR_POSITIONS[index]);
                if (left < -6 || left > 106) return null;
                return (
                  <button
                    type="button"
                    key={anchor.year}
                    className={territoryLayer.year === anchor.year ? "is-current" : ""}
                    style={{ left: `${left}%` }}
                    onClick={() => animateToPosition(TIMELINE_ANCHOR_POSITIONS[index])}
                    aria-label={`跳转到${formatHistoricalYear(anchor.year)}`}
                  >
                    <span>{formatDialYear(anchor.year)}</span>
                  </button>
                );
              })}
            </div>
            <div className="timeline-fixed-pointer" aria-hidden="true">
              <i />
              <span>{yearText(year)}<small>年</small></span>
            </div>
            <div className="timeline-drag-hint" aria-hidden="true">
              <CaretLeft size={12} /> 拖动整条年代尺探索全球疆域 <CaretRight size={12} />
            </div>
          </div>
          <div className="timeline-actions">
            <button type="button" onClick={() => stepEra(-1)} aria-label="上一时代">
              <CaretLeft size={16} weight="fill" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="play-button"
              onClick={() => {
                window.cancelAnimationFrame(animationRef.current);
                if (timelinePosition >= TIMELINE_MAX - 0.5) setTimelinePosition(0);
                setPlaying((value) => !value);
              }}
              aria-label={playing ? "暂停时间旅行" : "播放时间旅行"}
            >
              {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            </button>
            <button type="button" onClick={() => stepEra(1)} aria-label="下一时代">
              <CaretRight size={16} weight="fill" aria-hidden="true" />
            </button>
          </div>
        </section>
      </section>

      <section className="spectrum" aria-label="同一时刻的文明光谱">
        <header className="spectrum-header">
          <div>
            <strong>同一时刻的文明光谱</strong>
            <span>选择任意两个国家或历史政权进行对照</span>
          </div>
          <div className="comparison-tabs" role="list" aria-label="可比较的文明">
            {territoryLayer.comparisons.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`${comparisonIds.includes(item.id) ? "is-selected" : ""} tone-${item.tone}`}
                onClick={() => toggleComparison(item.id)}
                aria-pressed={comparisonIds.includes(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </header>

        <div className="spectrum-table" key={`${territoryLayer.year}-${comparisonIds.join("-")}`}>
          <div className="spectrum-table-head">
            <span />
            <button type="button" onClick={() => setViewMode("territory")}>{primaryComparison?.name}</button>
            <button type="button" className="swap-comparisons" onClick={swapComparisons} aria-label="交换对照顺序">
              <ArrowsLeftRight size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setViewMode("territory")}>{secondaryComparison?.name}</button>
          </div>
          {dimensions.map(({ key, label, Icon }) => (
            <div className="spectrum-row" key={key}>
              <div><Icon size={18} aria-hidden="true" /><span>{label}</span></div>
              <p>{primaryComparison?.values[key]}</p>
              <p>{secondaryComparison?.values[key]}</p>
            </div>
          ))}
        </div>
        <footer>
          <AnchorSimple size={14} aria-hidden="true" />
          这是策展式历史疆域原型；边界用于宏观学习，不作为现代政治或法律依据。
        </footer>
      </section>
    </main>
  );
}
