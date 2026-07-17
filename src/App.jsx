import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  ArrowsLeftRight,
  Atom,
  Bank,
  CaretLeft,
  CaretRight,
  Coins,
  Crosshair,
  CursorClick,
  Factory,
  GearSix,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Pause,
  Play,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { GlobeScene } from "./components/GlobeScene.jsx";
import {
  CITY_ALIASES,
  CURATED_CITIES,
  HISTORY_ANCHORS,
  formatHistoricalYear,
  getCityProfile,
  getEraForYear,
} from "./data/cityHistory.js";
import { WORLD_CITIES } from "./data/worldCities.generated.js";

const TIMELINE_MAX = 1000;
const TIMELINE_VISIBLE_SPAN = 1100;
// The chronometer is intentionally non-linear: antiquity keeps enough room to
// read while the accelerated modern centuries remain distinct on the dial.
const TIMELINE_ANCHOR_POSITIONS = [0, 130, 230, 340, 440, 530, 820, 1000];
const ORBITAL_TICK_POSITIONS = Array.from({ length: 151 }, (_, index) =>
  (index / 150) * TIMELINE_MAX,
);

const dimensions = [
  { key: "technology", label: "科技", Icon: Atom },
  { key: "economy", label: "经济", Icon: Coins },
  { key: "society", label: "社会", Icon: UsersThree },
  { key: "belief", label: "信仰", Icon: Bank },
];

const defaultPrimary =
  WORLD_CITIES.find((city) => city.name === "London" && city.country === "GB") ??
  WORLD_CITIES[0];
const defaultComparison =
  WORLD_CITIES.find((city) => city.name === "Guangzhou" && city.country === "CN") ??
  WORLD_CITIES[1];

const countryNames =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["zh-CN"], { type: "region" })
    : null;

const curatedNamesByEnglish = new Map(
  Object.values(CURATED_CITIES).map((city) => [
    String(city.enName).toLocaleLowerCase(),
    city.zhName,
  ]),
);

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[／/·,，.。()（）_-]/g, " ")
    .replace(/\s+/g, " ");
}

function countryLabel(code) {
  try {
    return countryNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

function cityDisplayName(city) {
  return curatedNamesByEnglish.get(String(city?.name ?? "").toLocaleLowerCase()) ?? city?.name ?? "";
}

function positionToYear(position) {
  const bounded = Math.max(0, Math.min(TIMELINE_MAX, Number(position)));
  let lowerIndex = HISTORY_ANCHORS.length - 2;
  for (let index = 0; index < TIMELINE_ANCHOR_POSITIONS.length - 1; index += 1) {
    if (bounded <= TIMELINE_ANCHOR_POSITIONS[index + 1]) {
      lowerIndex = index;
      break;
    }
  }
  const lowerPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex];
  const upperPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex + 1];
  const localProgress = (bounded - lowerPosition) / (upperPosition - lowerPosition);
  const lowerYear = HISTORY_ANCHORS[lowerIndex].year;
  const upperYear = HISTORY_ANCHORS[lowerIndex + 1].year;
  return Math.round(lowerYear + (upperYear - lowerYear) * localProgress);
}

function yearToPosition(year) {
  const bounded = Math.max(
    HISTORY_ANCHORS[0].year,
    Math.min(HISTORY_ANCHORS.at(-1).year, Number(year)),
  );
  let lowerIndex = 0;
  for (let index = 0; index < HISTORY_ANCHORS.length - 1; index += 1) {
    if (bounded <= HISTORY_ANCHORS[index + 1].year) {
      lowerIndex = index;
      break;
    }
  }
  const lowerYear = HISTORY_ANCHORS[lowerIndex].year;
  const upperYear = HISTORY_ANCHORS[lowerIndex + 1].year;
  const localProgress = (bounded - lowerYear) / (upperYear - lowerYear);
  const lowerPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex];
  const upperPosition = TIMELINE_ANCHOR_POSITIONS[lowerIndex + 1];
  return lowerPosition + localProgress * (upperPosition - lowerPosition);
}

function orbitalArcY(position) {
  const progress = Math.max(0, Math.min(1, position / TIMELINE_MAX));
  return 50 + Math.sqrt(Math.max(0, 1 - Math.pow(progress * 2 - 1, 2))) * 104;
}

function formatDialYear(year) {
  if (year < 0) return `公元前${Math.abs(year)}`;
  return String(year);
}

function CityButton({ city, profile, role, active, onClick }) {
  return (
    <button
      type="button"
      className={`city-column-button city-column-${role} ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{cityDisplayName(city)}</span>
      <small>{countryLabel(city.country)} · {profile.civilization}</small>
    </button>
  );
}

export function App() {
  const [timelinePosition, setTimelinePosition] = useState(() => yearToPosition(1785));
  const [playing, setPlaying] = useState(false);
  const [primaryCity, setPrimaryCity] = useState(defaultPrimary);
  const [comparisonCity, setComparisonCity] = useState(defaultComparison);
  const [focusCity, setFocusCity] = useState(defaultPrimary);
  const [activeSlot, setActiveSlot] = useState("comparison");
  const [viewMode, setViewMode] = useState("globe");
  const [zoomLevel, setZoomLevel] = useState("country");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const animationRef = useRef(0);
  const searchInputRef = useRef(null);
  const timelineTrackRef = useRef(null);
  const timelineDraggingRef = useRef(false);
  const timelineDragStartRef = useRef(null);
  const [timelineDragging, setTimelineDragging] = useState(false);

  const year = positionToYear(timelinePosition);
  const era = getEraForYear(year);
  const primaryProfile = useMemo(
    () => getCityProfile(primaryCity, year),
    [primaryCity, year],
  );
  const comparisonProfile = useMemo(
    () => getCityProfile(comparisonCity, year),
    [comparisonCity, year],
  );

  const globeCities = useMemo(() => {
    const unique = new Map();
    [primaryCity, comparisonCity, ...WORLD_CITIES.slice(0, 220)].forEach((city) => {
      if (city) unique.set(city.id, city);
    });
    return [...unique.values()];
  }, [comparisonCity, primaryCity]);

  const searchResults = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return WORLD_CITIES.slice(0, 8);

    const aliasId = CITY_ALIASES[normalized];
    const aliasCityName = aliasId ? CURATED_CITIES[aliasId]?.enName : null;
    const scored = [];

    for (const city of WORLD_CITIES) {
      const cityName = normalizeSearch(city.name);
      const country = normalizeSearch(countryLabel(city.country));
      const exactAlias = aliasCityName && cityName === normalizeSearch(aliasCityName);
      let score = 0;
      if (exactAlias) score = 1000;
      else if (cityName === normalized) score = 900;
      else if (cityName.startsWith(normalized)) score = 600;
      else if (cityName.includes(normalized)) score = 300;
      else if (country.includes(normalized)) score = 120;
      if (score) scored.push({ city, score: score + Math.log10(city.population + 10) });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map(({ city }) => city);
  }, [query]);

  useEffect(() => {
    if (!pickerOpen) return;
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pickerOpen]);

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

  useEffect(
    () => () => window.cancelAnimationFrame(animationRef.current),
    [],
  );

  const animateToPosition = useCallback((target) => {
    window.cancelAnimationFrame(animationRef.current);
    setPlaying(false);
    const from = timelinePosition;
    const to = Math.max(0, Math.min(TIMELINE_MAX, target));
    const startedAt = performance.now();
    const duration = Math.min(1100, 460 + Math.abs(to - from) * 0.8);

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
    timelineDraggingRef.current = true;
    timelineDragStartRef.current = {
      clientX: event.clientX,
      position: timelinePosition,
      width: bounds.width,
    };
    setTimelineDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continueTimelineDrag(event) {
    const start = timelineDragStartRef.current;
    if (!timelineDraggingRef.current || !start) return;
    const delta = event.clientX - start.clientX;
    const nextPosition = start.position - (delta / start.width) * TIMELINE_VISIBLE_SPAN;
    setTimelinePosition(Math.max(0, Math.min(TIMELINE_MAX, nextPosition)));
  }

  function endTimelineDrag(event) {
    if (!timelineDraggingRef.current) return;
    if (event.type === "pointerup") continueTimelineDrag(event);
    timelineDraggingRef.current = false;
    timelineDragStartRef.current = null;
    setTimelineDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTimelineKeyDown(event) {
    const yearStep = event.shiftKey ? 25 : 1;
    let targetYear = year;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") targetYear -= yearStep;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") targetYear += yearStep;
    else if (event.key === "PageDown") targetYear -= 100;
    else if (event.key === "PageUp") targetYear += 100;
    else if (event.key === "Home") targetYear = HISTORY_ANCHORS[0].year;
    else if (event.key === "End") targetYear = HISTORY_ANCHORS.at(-1).year;
    else return;
    event.preventDefault();
    window.cancelAnimationFrame(animationRef.current);
    setPlaying(false);
    setTimelinePosition(yearToPosition(targetYear));
  }

  const assignCity = useCallback((slot, city) => {
    if (!city) return;
    if (slot === "primary") setPrimaryCity(city);
    else setComparisonCity(city);
    setFocusCity(city);
    setActiveSlot(slot);
    setPickerOpen(false);
    setQuery("");
  }, []);

  const selectFromGlobe = useCallback((city) => {
    if (city.id === primaryCity.id) {
      setActiveSlot("primary");
      setFocusCity(city);
      return;
    }
    if (city.id === comparisonCity.id) {
      setActiveSlot("comparison");
      setFocusCity(city);
      return;
    }
    assignCity(activeSlot, city);
  }, [activeSlot, assignCity, comparisonCity.id, primaryCity.id]);

  function openCityPicker(slot) {
    setActiveSlot(slot);
    setPickerOpen(true);
    setQuery("");
  }

  function submitSearch(event) {
    event.preventDefault();
    if (searchResults[0]) assignCity(activeSlot, searchResults[0]);
  }

  function swapCities() {
    setPrimaryCity(comparisonCity);
    setComparisonCity(primaryCity);
    setFocusCity(comparisonCity);
  }

  function stepEra(direction) {
    const nearestIndex = HISTORY_ANCHORS.findIndex((anchor) => anchor.year === era.year);
    const nextIndex = Math.max(
      0,
      Math.min(HISTORY_ANCHORS.length - 1, nearestIndex + direction),
    );
    animateToPosition(TIMELINE_ANCHOR_POSITIONS[nextIndex]);
  }

  const timelineProgress = timelinePosition / TIMELINE_MAX;
  const timelinePointerY = orbitalArcY(TIMELINE_MAX / 2);
  const placeOnMovingDial = (position) =>
    50 + ((position - timelinePosition) / TIMELINE_VISIBLE_SPAN) * 100;

  return (
    <main className={`chronicle-app ${viewMode === "compare" ? "is-comparing" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="地球编年史首页">
          <GlobeHemisphereWest size={34} weight="thin" aria-hidden="true" />
          <span>地球编年史</span>
        </a>

        <form className="search" role="search" onSubmit={submitSearch}>
          <MagnifyingGlass size={20} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={query}
            onFocus={() => setPickerOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setPickerOpen(true);
            }}
            placeholder={`搜索全球城市 · 当前选择${activeSlot === "primary" ? "城市 A" : "城市 B"}`}
            aria-label="搜索全球城市"
          />
          {pickerOpen ? (
            <button type="button" aria-label="关闭城市搜索" onClick={() => setPickerOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" aria-label="搜索城市">
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}

          {pickerOpen && (
            <div className="city-search-popover" role="listbox" aria-label="城市搜索结果">
              <div className="city-search-slot">
                将结果设置为
                <button
                  type="button"
                  className={activeSlot === "primary" ? "is-active" : ""}
                  onClick={() => setActiveSlot("primary")}
                >
                  城市 A
                </button>
                <button
                  type="button"
                  className={activeSlot === "comparison" ? "is-active" : ""}
                  onClick={() => setActiveSlot("comparison")}
                >
                  城市 B
                </button>
              </div>
              {searchResults.length ? searchResults.map((city) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={city.id === (activeSlot === "primary" ? primaryCity.id : comparisonCity.id)}
                  key={city.id}
                  className="city-search-result"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => assignCity(activeSlot, city)}
                >
                  <MapPin size={17} weight="fill" aria-hidden="true" />
                  <span>
                    <strong>{city.name}</strong>
                    <small>{countryLabel(city.country)}</small>
                  </span>
                  <em>{city.population ? `${Math.round(city.population / 10000)} 万人` : "城市坐标"}</em>
                </button>
              )) : (
                <p className="city-search-empty">没有匹配到城市，试试英文名或国家名称。</p>
              )}
              <footer>城市坐标源自 GeoNames；历史内容为时期与区域概览</footer>
            </div>
          )}
        </form>

        <div className="mode-switch" aria-label="视图模式">
          <button
            type="button"
            className={viewMode === "globe" ? "is-active" : ""}
            onClick={() => setViewMode("globe")}
            aria-pressed={viewMode === "globe"}
          >
            地球
          </button>
          <button
            type="button"
            className={viewMode === "compare" ? "is-active" : ""}
            onClick={() => setViewMode("compare")}
            aria-pressed={viewMode === "compare"}
          >
            对照
          </button>
        </div>
      </header>

      <section className="hero" id="top" aria-label="三维历史地球与时间轴">
        <div className="globe-stage">
          <GlobeScene
            cities={globeCities}
            primaryCity={primaryCity}
            comparisonCity={comparisonCity}
            focusCity={focusCity}
            onSelectCity={selectFromGlobe}
            timeValue={year}
            zoomLevel={zoomLevel}
          />
        </div>

        <aside className="event-story" aria-live="polite">
          <div className="eyebrow">
            <GearSix size={19} weight="fill" aria-hidden="true" />
            <strong>{era.title}</strong>
            <span>·</span>
            <span>{era.range}</span>
          </div>
          <div className="story-content" key={`${era.year}-${primaryCity.id}`}>
            <span className="story-time">{formatHistoricalYear(year)} · {cityDisplayName(primaryCity)}</span>
            <h2>{primaryProfile.eventTitle}</h2>
            <p>{primaryProfile.summary}</p>
          </div>
          <button type="button" onClick={() => openCityPicker("comparison")}>
            选择另一座城市同期对照
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </aside>

        <div className="globe-hint">
          <CursorClick size={18} aria-hidden="true" />
          <span>拖拽旋转 · 滚轮缩放 · 点击城市</span>
        </div>

        <div className="selected-city-chips" aria-label="当前对照城市">
          <button
            type="button"
            className={activeSlot === "primary" ? "is-active" : ""}
            onClick={() => openCityPicker("primary")}
          >
            <i />
            <span>A · {cityDisplayName(primaryCity)}</span>
          </button>
          <ArrowsLeftRight size={17} aria-hidden="true" />
          <button
            type="button"
            className={activeSlot === "comparison" ? "is-active" : ""}
            onClick={() => openCityPicker("comparison")}
          >
            <i />
            <span>B · {cityDisplayName(comparisonCity)}</span>
          </button>
        </div>

        <aside className="zoom-rail" aria-label="地图缩放精度">
          <span className="zoom-title">地图缩放精度</span>
          {[
            ["country", "国家", GlobeHemisphereWest],
            ["province", "省份", MapTrifold],
            ["county", "县域", Crosshair],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              className={zoomLevel === value ? "is-active" : ""}
              onClick={() => {
                setZoomLevel(value);
                setFocusCity(activeSlot === "primary" ? primaryCity : comparisonCity);
              }}
              aria-label={label}
              aria-pressed={zoomLevel === value}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <small>最高精度：县域</small>
        </aside>

        {viewMode === "compare" && (
          <aside className="compare-drawer" aria-label="城市同期对照摘要">
            <header>
              <span>{formatHistoricalYear(year)}</span>
              <button type="button" onClick={swapCities} aria-label="交换对照城市">
                <ArrowsLeftRight size={18} aria-hidden="true" />
              </button>
            </header>
            <div>
              <strong>{cityDisplayName(primaryCity)}</strong>
              <p>{primaryProfile.summary}</p>
            </div>
            <div>
              <strong>{cityDisplayName(comparisonCity)}</strong>
              <p>{comparisonProfile.summary}</p>
            </div>
          </aside>
        )}

        <section className="timeline-control" aria-label="连续历史时间轴">
          <div
            ref={timelineTrackRef}
            className={`timeline-track-wrap ${timelineDragging ? "is-dragging" : ""}`}
            onPointerDown={beginTimelineDrag}
            onPointerMove={continueTimelineDrag}
            onPointerUp={endTimelineDrag}
            onPointerCancel={endTimelineDrag}
            onKeyDown={handleTimelineKeyDown}
            role="slider"
            tabIndex="0"
            aria-label="历史年代轨道，左右拖动整条轨道选择年份"
            aria-valuemin={HISTORY_ANCHORS[0].year}
            aria-valuemax={HISTORY_ANCHORS.at(-1).year}
            aria-valuenow={year}
            aria-valuetext={formatHistoricalYear(year)}
          >
            <div className="orbital-back-rings" aria-hidden="true">
              <i />
              <i />
            </div>
            <div className="orbital-front-ring" aria-hidden="true" />
            <div className="orbital-ticks" aria-hidden="true">
              {ORBITAL_TICK_POSITIONS.map((position, index) => {
                const displayPercent = placeOnMovingDial(position);
                if (displayPercent < -1 || displayPercent > 101) return null;
                const displayPosition = displayPercent * 10;
                const radialPosition = displayPosition / TIMELINE_MAX * 2 - 1;
                const isMajor = index % 10 === 0;
                return (
                  <i
                    key={position}
                    className={isMajor ? "is-major" : ""}
                    style={{
                      left: `${displayPercent}%`,
                      top: `${orbitalArcY(displayPosition)}px`,
                      transform: `translate(-50%, -50%) rotate(${radialPosition * 46}deg)`,
                    }}
                  />
                );
              })}
            </div>
            <div className="orbital-progress" aria-hidden="true" />
            <div className="timeline-anchors">
              {HISTORY_ANCHORS.map((anchor, index) => {
                const displayPercent = placeOnMovingDial(TIMELINE_ANCHOR_POSITIONS[index]);
                if (displayPercent < -6 || displayPercent > 106) return null;
                return (
                  <button
                    type="button"
                    key={anchor.year}
                    className={
                      Math.abs(TIMELINE_ANCHOR_POSITIONS[index] - timelinePosition) < 3
                        ? "is-under-pointer"
                        : ""
                    }
                    style={{
                      left: `${displayPercent}%`,
                      top: `${orbitalArcY(displayPercent * 10)}px`,
                    }}
                    onClick={() => animateToPosition(TIMELINE_ANCHOR_POSITIONS[index])}
                    aria-label={`跳转到${formatHistoricalYear(anchor.year)}`}
                  >
                    <i />
                    <span>{formatDialYear(anchor.year)}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="timeline-pointer"
              style={{
                left: "50%",
                top: `${timelinePointerY}px`,
              }}
              aria-hidden="true"
            >
              <i />
              <span>{formatDialYear(year)}年</span>
            </div>

            <div className="timeline-drag-caption" aria-hidden="true">
              <span>左右拖动整条年代轨道</span>
              <em>中央指针读取年份 · {Math.round(timelineProgress * 100)}%</em>
            </div>
          </div>

          <div className="timeline-actions">
            <button type="button" onClick={() => stepEra(-1)}>
              <CaretLeft size={16} weight="fill" aria-hidden="true" />
              上一时代
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
              {playing ? (
                <Pause size={22} weight="fill" aria-hidden="true" />
              ) : (
                <Play size={22} weight="fill" aria-hidden="true" />
              )}
            </button>
            <button type="button" onClick={() => stepEra(1)}>
              下一时代
              <CaretRight size={16} weight="fill" aria-hidden="true" />
            </button>
          </div>
        </section>
      </section>

      <section className="spectrum" aria-label="同一时刻的文明光谱">
        <header>
          <div className="spectrum-title">
            <span>同一时刻的文明光谱</span>
            <button type="button" onClick={swapCities} aria-label="交换对照城市">
              <ArrowsLeftRight size={17} aria-hidden="true" />
            </button>
          </div>
          <CityButton
            city={primaryCity}
            profile={primaryProfile}
            role="primary"
            active={activeSlot === "primary"}
            onClick={() => openCityPicker("primary")}
          />
          <CityButton
            city={comparisonCity}
            profile={comparisonProfile}
            role="comparison"
            active={activeSlot === "comparison"}
            onClick={() => openCityPicker("comparison")}
          />
        </header>

        <div className="spectrum-rows" key={`${era.year}-${primaryCity.id}-${comparisonCity.id}`}>
          {dimensions.map(({ key, label, Icon }) => (
            <div className="spectrum-row" key={key}>
              <div className="dimension">
                <Icon size={21} aria-hidden="true" />
                <span>{label}</span>
              </div>
              <button type="button" onClick={() => openCityPicker("primary")}>
                {primaryProfile.dimensions[key]}
              </button>
              <button type="button" onClick={() => openCityPicker("comparison")}>
                {comparisonProfile.dimensions[key]}
              </button>
            </div>
          ))}
        </div>

        <footer>
          <Factory size={16} aria-hidden="true" />
          <span>不做文明价值排名 · 城市坐标源自 GeoNames · 历史内容为策展式区域概览</span>
        </footer>
      </section>
    </main>
  );
}
