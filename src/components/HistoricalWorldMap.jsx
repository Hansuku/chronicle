import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnchorSimple,
  ArrowCounterClockwise,
  BookOpenText,
  Crown,
  Factory,
  MapPinArea,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

const WORLD_GEOMETRIES = worldAtlas.objects.countries.geometries;
const WORLD_FEATURES = feature(worldAtlas, worldAtlas.objects.countries).features;
const MODERN_PALETTE = ["#7a806c", "#77705e", "#637f7d", "#87725d", "#6b7681", "#7d685e"];
const MIN_ZOOM = 1;
const MAX_ZOOM = 3.2;
const BUTTON_ZOOM_FACTOR = 1.35;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function constrainView(view, size) {
  const scale = clamp(view.scale, MIN_ZOOM, MAX_ZOOM);
  if (scale <= MIN_ZOOM) return { scale: MIN_ZOOM, x: 0, y: 0 };
  return {
    scale,
    x: clamp(view.x, size.width * (1 - scale), 0),
    y: clamp(view.y, size.height * (1 - scale), 0),
  };
}

function countryColor(name) {
  let hash = 0;
  for (const character of String(name)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return MODERN_PALETTE[hash % MODERN_PALETTE.length];
}

function EventIcon({ type }) {
  if (type === "technology") return <Factory size={14} weight="fill" aria-hidden="true" />;
  if (type === "trade") return <AnchorSimple size={14} weight="bold" aria-hidden="true" />;
  if (type === "writing" || type === "culture") return <BookOpenText size={14} weight="fill" aria-hidden="true" />;
  return <Crown size={14} weight="fill" aria-hidden="true" />;
}

function useMapSize(ref) {
  const [size, setSize] = useState({ width: 1120, height: 560 });

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(320, entry.contentRect.width);
      const height = Math.max(260, entry.contentRect.height);
      setSize({ width, height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export function HistoricalWorldMap({
  layer,
  activeGroupId,
  activeEventId,
  layers,
  onSelectGroup,
  onSelectEvent,
  onClearEvent,
  coordinatePickerActive = false,
  editableEventId = "",
  onPickCoordinates,
  onMoveEditableEvent,
}) {
  const mapRef = useRef(null);
  const panRef = useRef(null);
  const eventDragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressEventClickRef = useRef("");
  const [view, setView] = useState({ scale: MIN_ZOOM, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const size = useMapSize(mapRef);
  const projection = useMemo(
    () => geoNaturalEarth1().fitExtent(
      [[18, 14], [size.width - 18, size.height - 14]],
      { type: "Sphere" },
    ),
    [size.height, size.width],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticulePath = useMemo(() => path(geoGraticule10()), [path]);
  const spherePath = useMemo(() => path({ type: "Sphere" }), [path]);

  const groupShapes = useMemo(() => layer.groups.map((group) => {
    const countrySet = new Set(group.countries);
    const geometries = WORLD_GEOMETRIES.filter((geometry) => countrySet.has(geometry.properties?.name));
    if (!geometries.length) return null;
    return {
      ...group,
      path: path(merge(worldAtlas, geometries)),
    };
  }).filter(Boolean), [layer.groups, path]);

  const activeEvent = layer.events.find((event) => event.id === activeEventId) ?? null;

  useEffect(() => {
    setView((current) => constrainView(current, size));
  }, [size]);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return undefined;
    const preventPageScrollAndZoom = (event) => {
      event.preventDefault();
      const bounds = mapElement.getBoundingClientRect();
      const origin = bounds.width && bounds.height ? {
        x: (event.clientX - bounds.left) * (size.width / bounds.width),
        y: (event.clientY - bounds.top) * (size.height / bounds.height),
      } : { x: size.width / 2, y: size.height / 2 };
      zoomAt(Math.exp(-event.deltaY * 0.00125), origin);
    };
    mapElement.addEventListener("wheel", preventPageScrollAndZoom, { passive: false });
    return () => mapElement.removeEventListener("wheel", preventPageScrollAndZoom);
  }, [size]);

  function zoomAt(factor, origin = { x: size.width / 2, y: size.height / 2 }) {
    setView((current) => {
      const scale = clamp(current.scale * factor, MIN_ZOOM, MAX_ZOOM);
      const mapX = (origin.x - current.x) / current.scale;
      const mapY = (origin.y - current.y) / current.scale;
      return constrainView({
        scale,
        x: origin.x - mapX * scale,
        y: origin.y - mapY * scale,
      }, size);
    });
  }

  function pointInMap(event) {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds?.height) return { x: size.width / 2, y: size.height / 2 };
    return {
      x: (event.clientX - bounds.left) * (size.width / bounds.width),
      y: (event.clientY - bounds.top) * (size.height / bounds.height),
    };
  }

  function coordinatesFromPointer(event) {
    const point = pointInMap(event);
    const coordinates = projection.invert([
      (point.x - view.x) / view.scale,
      (point.y - view.y) / view.scale,
    ]);
    if (!coordinates) return null;
    const [longitude, latitude] = coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    return [Number(longitude.toFixed(4)), Number(latitude.toFixed(4))];
  }

  function beginPan(event) {
    if (event.button !== 0 || view.scale <= MIN_ZOOM || event.target.closest("button, article, .map-zoom-cluster")) return;
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds?.height) return;
    panRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      view,
      ratioX: size.width / bounds.width,
      ratioY: size.height / bounds.height,
      moved: false,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continuePan(event) {
    const start = panRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = (event.clientX - start.clientX) * start.ratioX;
    const deltaY = (event.clientY - start.clientY) * start.ratioY;
    if (Math.hypot(deltaX, deltaY) > 3) start.moved = true;
    setView(constrainView({
      ...start.view,
      x: start.view.x + deltaX,
      y: start.view.y + deltaY,
    }, size));
  }

  function endPan(event) {
    const start = panRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (event.type !== "pointercancel") continuePan(event);
    if (start.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    panRef.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleClickCapture(event) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleMapClick(event) {
    if (event.target.closest(".map-event-pin, .map-event-card, .map-zoom-cluster")) return;
    if (coordinatePickerActive) {
      const coordinates = coordinatesFromPointer(event);
      if (coordinates) onPickCoordinates?.(coordinates);
      return;
    }
    onClearEvent?.();
  }

  function beginEventDrag(event, historicalEvent) {
    if (historicalEvent.id !== editableEventId || !onMoveEditableEvent) return;
    event.preventDefault();
    event.stopPropagation();
    eventDragRef.current = {
      pointerId: event.pointerId,
      eventId: historicalEvent.id,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveEventDrag(event, historicalEvent) {
    const start = eventDragRef.current;
    if (!start || start.pointerId !== event.pointerId || start.eventId !== historicalEvent.id) return;
    if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) > 2) start.moved = true;
    const coordinates = coordinatesFromPointer(event);
    if (coordinates) onMoveEditableEvent?.(coordinates);
  }

  function endEventDrag(event, historicalEvent) {
    const start = eventDragRef.current;
    if (!start || start.pointerId !== event.pointerId || start.eventId !== historicalEvent.id) return;
    if (event.type !== "pointercancel") moveEventDrag(event, historicalEvent);
    if (start.moved) {
      suppressEventClickRef.current = historicalEvent.id;
      window.setTimeout(() => {
        if (suppressEventClickRef.current === historicalEvent.id) suppressEventClickRef.current = "";
      }, 0);
    }
    eventDragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function transformPoint(point) {
    return [point[0] * view.scale + view.x, point[1] * view.scale + view.y];
  }

  const atMinimumZoom = view.scale <= MIN_ZOOM + 0.001;
  const atMaximumZoom = view.scale >= MAX_ZOOM - 0.001;

  return (
    <div
      className={`historical-map ${atMinimumZoom ? "" : "is-pannable"} ${panning ? "is-panning" : ""} ${coordinatePickerActive ? "is-coordinate-picker" : ""}`}
      ref={mapRef}
      onDoubleClick={(event) => zoomAt(BUTTON_ZOOM_FACTOR, pointInMap(event))}
      onPointerDown={beginPan}
      onPointerMove={continuePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onClickCapture={handleClickCapture}
      onClick={handleMapClick}
    >
      <svg
        className="historical-map-svg"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={`${layer.year} 年全球国家与政权疆域地图`}
      >
        <g transform={`matrix(${view.scale} 0 0 ${view.scale} ${view.x} ${view.y})`}>
          <path className="map-ocean-boundary" d={spherePath ?? ""} />
          <path className="map-graticule" d={graticulePath ?? ""} />

          <g className={`base-countries ${layer.modern ? "is-modern" : "is-historical"}`}>
            {WORLD_FEATURES.map((country) => (
              <path
                key={`${country.id}-${country.properties?.name}`}
                d={path(country) ?? ""}
                fill={layer.modern ? countryColor(country.properties?.name) : "#263038"}
              >
                <title>{country.properties?.name}</title>
              </path>
            ))}
          </g>

          <g className="historical-territories" key={layer.stateKey ?? layer.year}>
            {groupShapes.map((group) => {
              const hiddenColony = group.status === "colony" && !layers.colonies;
              return (
                <path
                  key={group.id}
                  d={group.path ?? ""}
                  className={`territory-shape territory-${group.status ?? "sovereign"} ${group.id === activeGroupId ? "is-active" : ""} ${hiddenColony ? "is-muted" : ""}`}
                  style={{ "--territory-color": group.color }}
                  onClick={(event) => {
                    if (coordinatePickerActive) return;
                    event.stopPropagation();
                    onSelectGroup?.(group);
                  }}
                  tabIndex={coordinatePickerActive ? -1 : 0}
                  role="button"
                  aria-label={`查看${group.name}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectGroup?.(group);
                    }
                  }}
                >
                  <title>{group.name}</title>
                </path>
              );
            })}
          </g>

          <g className="polity-labels" key={`labels-${layer.stateKey ?? layer.year}`} aria-hidden="true">
            {layer.groups.map((group) => {
              const point = projection(group.label);
              if (!point) return null;
              const hiddenColony = group.status === "colony" && !layers.colonies;
              if (hiddenColony) return null;
              return (
                <g
                  key={group.id}
                  transform={`translate(${point[0]} ${point[1]}) scale(${1 / view.scale}) translate(${-point[0]} ${-point[1]})`}
                >
                  <text
                    x={point[0]}
                    y={point[1]}
                    className={group.id === activeGroupId ? "is-active" : ""}
                  >
                    {group.name}
                    {layers.metrics ? <tspan x={point[0]} dy="12">文明活跃度 {62 + (group.id.length * 7) % 33}</tspan> : null}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {layers.events ? (
        <div className="map-event-layer" key={`events-${layer.year}`}>
          {layer.events.map((event) => {
            const point = projection(event.coordinates);
            if (!point) return null;
            const transformedPoint = transformPoint(point);
            return (
              <button
                key={event.id}
                type="button"
                className={`map-event-pin event-${event.type} ${event.id === activeEventId ? "is-active" : ""}`}
                style={{ left: `${transformedPoint[0]}px`, top: `${transformedPoint[1]}px` }}
                aria-label={`${event.name}，${event.location}`}
                onPointerDown={(pointerEvent) => beginEventDrag(pointerEvent, event)}
                onPointerMove={(pointerEvent) => moveEventDrag(pointerEvent, event)}
                onPointerUp={(pointerEvent) => endEventDrag(pointerEvent, event)}
                onPointerCancel={(pointerEvent) => endEventDrag(pointerEvent, event)}
                onClick={() => {
                  if (suppressEventClickRef.current === event.id) return;
                  onSelectEvent?.(event);
                }}
              >
                <EventIcon type={event.type} />
              </button>
            );
          })}
        </div>
      ) : null}

      {activeEvent ? (() => {
        const point = projection(activeEvent.coordinates);
        if (!point) return null;
        const transformedPoint = transformPoint(point);
        return (
          <article
            className="map-event-card"
            style={{
              left: `${Math.min(size.width - 250, Math.max(16, transformedPoint[0] + 16))}px`,
              top: `${Math.min(size.height - 118, Math.max(12, transformedPoint[1] - 46))}px`,
            }}
            aria-live="polite"
          >
            <span><MapPinArea size={14} weight="fill" aria-hidden="true" /> {activeEvent.location}</span>
            <strong>{activeEvent.name}</strong>
            <p>{activeEvent.detail}</p>
          </article>
        );
      })() : null}

      <div className="map-zoom-cluster">
        <span>滚轮缩放 · 放大后拖拽平移</span>
        <div className="map-zoom-controls" role="group" aria-label="地图缩放控制">
          <button
            type="button"
            onClick={() => zoomAt(BUTTON_ZOOM_FACTOR)}
            disabled={atMaximumZoom}
            aria-label="放大地图"
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label={`当前地图缩放 ${Math.round(view.scale * 100)}%`}>
            {Math.round(view.scale * 100)}%
          </output>
          <button
            type="button"
            onClick={() => zoomAt(1 / BUTTON_ZOOM_FACTOR)}
            disabled={atMinimumZoom}
            aria-label="缩小地图"
          >
            <Minus size={16} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="map-zoom-reset"
            onClick={() => setView({ scale: MIN_ZOOM, x: 0, y: 0 })}
            disabled={atMinimumZoom}
            aria-label="重置为全球视图"
          >
            <ArrowCounterClockwise size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
