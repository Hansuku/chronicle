# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Current design direction

- The user selected the third generated concept: a centered Earth, an orbital time ring as the primary interaction, and a lower "同一时刻的文明光谱" comparison surface.
- Preserve the restrained deep navy, spectral cyan, and amber scientific-observatory visual language.
- Keep the globe view as the default, with interactive time travel, event pins, map scale, and a dedicated comparison mode.
- The Earth must be a real Three.js scene with inertial drag rotation, zoom, and smooth camera movement; do not fall back to a static globe image for the primary experience.
- The timeline must support continuous dragging and animated transitions instead of discrete, abrupt era jumps.
- Time selection uses a stationary amber needle and centered year readout. Users drag the entire orbital scale beneath the needle; never turn the needle into a movable range thumb.
- City comparison must be global and user-selectable. Do not hard-code the comparison to China versus Europe.
- Preserve the selected static concept's premium fidelity after adding interaction: the timeline should remain an orbital chronometer visually integrated with the globe, not a generic rectangular range card.
- The globe must stay crisp at the supported county zoom and retain the concept's atmospheric rim, edge glow, night-side lights, and layered scientific-observatory depth.
