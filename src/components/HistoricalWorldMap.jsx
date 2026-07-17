import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnchorSimple,
  BookOpenText,
  Crown,
  Factory,
  MapPinArea,
} from "@phosphor-icons/react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

const WORLD_GEOMETRIES = worldAtlas.objects.countries.geometries;
const WORLD_FEATURES = feature(worldAtlas, worldAtlas.objects.countries).features;
const MODERN_PALETTE = ["#7a806c", "#77705e", "#637f7d", "#87725d", "#6b7681", "#7d685e"];

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
}) {
  const mapRef = useRef(null);
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
  }).filter(Boolean), [layer, path]);

  const activeEvent = layer.events.find((event) => event.id === activeEventId) ?? null;

  return (
    <div className="historical-map" ref={mapRef}>
      <svg
        className="historical-map-svg"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={`${layer.year} 年全球国家与政权疆域地图`}
      >
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

        <g className="historical-territories" key={layer.year}>
          {groupShapes.map((group) => {
            const hiddenColony = group.status === "colony" && !layers.colonies;
            return (
              <path
                key={group.id}
                d={group.path ?? ""}
                className={`territory-shape territory-${group.status ?? "sovereign"} ${group.id === activeGroupId ? "is-active" : ""} ${hiddenColony ? "is-muted" : ""}`}
                style={{ "--territory-color": group.color }}
                onClick={() => onSelectGroup(group)}
                tabIndex="0"
                role="button"
                aria-label={`查看${group.name}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectGroup(group);
                  }
                }}
              >
                <title>{group.name}</title>
              </path>
            );
          })}
        </g>

        <g className="polity-labels" key={`labels-${layer.year}`} aria-hidden="true">
          {layer.groups.map((group) => {
            const point = projection(group.label);
            if (!point) return null;
            const hiddenColony = group.status === "colony" && !layers.colonies;
            if (hiddenColony) return null;
            return (
              <text
                key={group.id}
                x={point[0]}
                y={point[1]}
                className={group.id === activeGroupId ? "is-active" : ""}
              >
                {group.name}
                {layers.metrics ? <tspan x={point[0]} dy="12">文明活跃度 {62 + (group.id.length * 7) % 33}</tspan> : null}
              </text>
            );
          })}
        </g>
      </svg>

      {layers.events ? (
        <div className="map-event-layer" key={`events-${layer.year}`}>
          {layer.events.map((event) => {
            const point = projection(event.coordinates);
            if (!point) return null;
            return (
              <button
                key={event.id}
                type="button"
                className={`map-event-pin event-${event.type} ${event.id === activeEventId ? "is-active" : ""}`}
                style={{ left: `${point[0]}px`, top: `${point[1]}px` }}
                aria-label={`${event.name}，${event.location}`}
                onClick={() => onSelectEvent(event)}
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
        return (
          <article
            className="map-event-card"
            style={{
              left: `${Math.min(size.width - 250, Math.max(16, point[0] + 16))}px`,
              top: `${Math.min(size.height - 118, Math.max(12, point[1] - 46))}px`,
            }}
            aria-live="polite"
          >
            <span><MapPinArea size={14} weight="fill" aria-hidden="true" /> {activeEvent.location}</span>
            <strong>{activeEvent.name}</strong>
            <p>{activeEvent.detail}</p>
          </article>
        );
      })() : null}
    </div>
  );
}
