import assert from "node:assert/strict";
import worldAtlas from "world-atlas/countries-110m.json" with { type: "json" };
import {
  getTerritoryLayer,
  matchesHistoricalGroup,
  TERRITORY_ANCHORS,
  TERRITORY_LAYERS,
} from "../src/data/historicalTerritories.js";
import {
  HISTORICAL_EVENT_CONTENT,
  HISTORICAL_EVENTS,
  validateEventContent,
} from "../src/data/eventContent.js";

const atlasCountries = new Set(
  worldAtlas.objects.countries.geometries.map((geometry) => geometry.properties?.name),
);

assert.deepEqual(
  TERRITORY_ANCHORS.map(({ year }) => year),
  [...TERRITORY_ANCHORS].map(({ year }) => year).sort((left, right) => left - right),
  "Historical anchors must stay in chronological order",
);

assert.deepEqual(
  TERRITORY_LAYERS.map(({ effectiveFrom }) => effectiveFrom),
  [...TERRITORY_LAYERS].map(({ effectiveFrom }) => effectiveFrom).sort((left, right) => left - right),
  "Historical state boundaries must stay in chronological order",
);

for (const layer of TERRITORY_LAYERS) {
  const groupIds = new Set();
  for (const group of layer.groups) {
    assert.ok(!groupIds.has(group.id), `${layer.year}: duplicate group ${group.id}`);
    groupIds.add(group.id);
    if (group.validFrom != null) {
      assert.ok(group.validTo == null || group.validFrom <= group.validTo, `${group.id}: invalid date range`);
    }
    for (const country of group.countries) {
      assert.ok(atlasCountries.has(country), `${layer.year}/${group.id}: unknown atlas country ${country}`);
    }
  }
  for (const comparison of layer.comparisons) {
    assert.ok(groupIds.has(comparison.id), `${layer.year}: comparison ${comparison.id} has no map group`);
  }
}

const eventContentValidation = validateEventContent(HISTORICAL_EVENT_CONTENT);
assert.deepEqual(eventContentValidation.errors, [], "Historical event content must pass schema checks");
assert.equal(
  new Set(HISTORICAL_EVENTS.map((event) => event.id)).size,
  HISTORICAL_EVENTS.length,
  "Historical event IDs must be globally unique",
);

for (const event of HISTORICAL_EVENTS) {
  assert.ok(
    getTerritoryLayer(event.year).events.some((candidate) => candidate.id === event.id),
    `${event.id}: event must be visible in its exact year`,
  );
  assert.ok(
    !getTerritoryLayer(event.year - 1).events.some((candidate) => candidate.id === event.id),
    `${event.id}: event must not appear one year early`,
  );
  assert.ok(
    !getTerritoryLayer(event.year + 1).events.some((candidate) => candidate.id === event.id),
    `${event.id}: event must not appear one year late`,
  );
}

const layer535 = getTerritoryLayer(535);
assert.equal(layer535.year, 535, "535 must use its own historical snapshot");
assert.equal(
  layer535.groups.find((group) => group.countries.includes("China"))?.name,
  "东魏、西魏与南梁",
  "535 China label must reflect the Southern and Northern Dynasties",
);
assert.ok(!layer535.groups.some((group) => group.name === "北宋"), "535 must never display Northern Song");
assert.equal(getTerritoryLayer(536).year, 536, "The selected year must never snap to an anchor");
assert.equal(getTerritoryLayer(1786).year, 1786, "Every selected year must remain exact");
assert.ok(getTerritoryLayer(536).events.every((event) => event.year === 536), "Events must match the selected year");

assert.ok(!getTerritoryLayer(959).groups.some((group) => group.name === "北宋"));
assert.ok(getTerritoryLayer(960).groups.some((group) => group.name === "北宋"));
assert.ok(getTerritoryLayer(1127).groups.some((group) => group.name === "北宋"));
assert.ok(!getTerritoryLayer(1128).groups.some((group) => group.name === "北宋"));

const layer1949 = getTerritoryLayer(1949);
const modernChina = layer1949.groups.find((group) => group.id === "china");
assert.ok(modernChina, "1949 must include the People's Republic of China");
assert.ok(matchesHistoricalGroup(modernChina, "中国"), "1949 China must be searchable by its common name");
assert.ok(!getTerritoryLayer(1948).groups.some((group) => group.id === "china"), "PRC must not appear before 1949");

const layer1644 = getTerritoryLayer(1644);
assert.equal(layer1644.year, 1644, "1644 must remain the selected year");
assert.ok(
  layer1644.events.some((event) => event.id === "cn-1644-beijing-fall"),
  "1644 must include the authored Beijing event",
);
assert.ok(
  !getTerritoryLayer(1643).events.some((event) => event.id === "cn-1644-beijing-fall"),
  "The authored Beijing event must not appear before 1644",
);

for (let year = TERRITORY_ANCHORS[0].year; year <= TERRITORY_ANCHORS.at(-1).year; year += 1) {
  const resolved = getTerritoryLayer(year);
  assert.equal(resolved.year, year, `${year}: selected year was altered`);
  assert.ok(resolved.events.every((event) => event.year === year), `${year}: event belongs to another year`);
}

console.log("Historical data checks passed.");
