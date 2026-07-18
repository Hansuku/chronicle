# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Current design direction

- The user replaced the globe direction with a hybrid of the first and third flat-map concepts: use the first concept's dark hand-drawn antique atlas style and the third concept's global map, right-side situation brief, fixed-center timeline, and lower comparison layout.
- The primary surface is a flat, hand-drawn world map showing country- or polity-level historical territory. Do not use a globe, satellite imagery, province/county drill-down, or modern borders as the default for historical dates.
- Time travel is global: changing the year must update political borders, polity names, colonial/dependency status, event markers, and spheres of influence across every world region. London and Guangzhou are examples, never the product's scope.
- Preserve the restrained deep navy, mineral cyan, aged parchment, and amber scientific-atlas visual language.
- The timeline must support continuous dragging and animated transitions instead of discrete, abrupt era jumps.
- Time selection uses a stationary amber needle and centered year readout. Users drag the entire orbital scale beneath the needle; never turn the needle into a movable range thumb.
- Civilization comparison must remain global and user-selectable. Do not hard-code the comparison to China versus Europe or to a fixed pair of cities.
- The flat historical map supports continuous zoom and drag-to-pan while preserving country/polity-level detail; zooming must not imply province or county drill-down.
- Milestone state transitions must have explicit time layers instead of being approximated by a distant anchor; search must recognize common country names and aliases alongside period-accurate formal polity names.
- Historical event cards are opt-in: never auto-open one when the timeline changes, and close the active card when the user clicks elsewhere on the map.
- Never display a named dynasty outside its documented date range merely because it is the nearest snapshot; add milestone layers for reported years and use validity bounds to suppress anachronistic polity labels.
