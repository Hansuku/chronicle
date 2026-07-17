# Design QA — Visual Refinement

- Source visual truth: `/var/folders/lt/124glwy556vgn_b1scc__b380000gn/T/codex-clipboard-2efdcee8-969f-46a3-bd7a-6a9fc6a5846c.png`
- Normalized source: `/Users/pisell/Documents/chronicle/artifacts/timeline-source-normalized-1440x1024.png`
- Final implementation: `/Users/pisell/Documents/chronicle/artifacts/timeline-fixed-needle-before-drag-1440x1024.png`
- Final full-view comparison: `/Users/pisell/Documents/chronicle/artifacts/timeline-fixed-needle-comparison-final.png`
- Final Earth and timeline comparison: `/Users/pisell/Documents/chronicle/artifacts/timeline-fixed-needle-focus-comparison-final.png`
- Final spectrum comparison: `/Users/pisell/Documents/chronicle/artifacts/refine-comparison-spectrum-final.png`
- Desktop viewport: 1440 × 1024
- Mobile viewport: 390 × 844
- Reference state: 1785, Earth mode, London versus Guangzhou, country camera

## Final Findings

- No open P0, P1, or P2 visual findings.
- The defining orbital chronometer is restored as the primary time interaction. The amber needle and year readout remain fixed at the center while the complete nonlinear scale, 151 ticks, and historical labels move beneath it during continuous dragging.
- The globe uses a high-resolution day surface, night-light layer, topographic relief, cloud layer, anisotropic filtering, filmic tone mapping, and layered atmospheric rims. County zoom remains visually detailed and retains the limb glow.
- The default camera frames London and Guangzhou on the same Eurasian hemisphere. Province and county modes move to the selected city rather than preserving the wide paired-city view.
- The lower civilization spectrum now matches the reference hierarchy more closely while retaining readable, non-ranking historical comparisons.

## Required Fidelity Surfaces

- Fonts and typography: passed; year, story, city labels, and spectrum rows have the intended visual hierarchy.
- Spacing and layout rhythm: passed at 1440 × 1024 and 390 × 844.
- Colors and visual tokens: passed; restrained deep navy, spectral cyan, and amber remain consistent.
- Image quality and asset fidelity: passed; final globe and atmospheric treatment resolve the original softness and missing-edge-light findings.
- Copy and content: passed; historical copy remains coherent and comparison-safe.
- Icons: passed; the existing Phosphor family remains consistent.
- Responsiveness and accessibility: passed; semantic labels, pressed states, visible focus targets, and mobile stacking remain present.

## Comparison History

### Refinement pass 0 — blocked

- Evidence: `/Users/pisell/Documents/chronicle/artifacts/refine-comparison-before.png`
- Findings: generic rectangular timeline, soft Earth texture, flat halo, Atlantic framing, and sparse background depth.

### Refinement pass 1 — improved

- Evidence: `/Users/pisell/Documents/chronicle/artifacts/refine-comparison-pass1.png`
- Resolved: 8K globe materials, Eurasian paired-city framing, layered rim light, and orbital timeline geometry.
- Remaining: timeline tick density, spectrum typography, and duplicated 3D/CSS orbit treatment at close zoom.

### Refinement pass 5 — passed

- Evidence: `/Users/pisell/Documents/chronicle/artifacts/refine-comparison-final.png`
- Resolved: explicit dense ticks, source-like year marker, clearer spectrum typography, single authoritative CSS chronometer, stronger tone mapping, and stable close zoom.

### Interaction pass 6 — passed

- Evidence: `/Users/pisell/Documents/chronicle/artifacts/timeline-fixed-needle-interaction-comparison.png`
- Earlier finding: the whole control was draggable, but the amber point travelled to the pointer position like a conventional range thumb.
- Fix: pin the amber needle and readout to the visual center, convert pointer movement into an inverse translation of the complete timeline scale, retain nonlinear year mapping, and expose the moving rail as an accessible slider.
- Post-fix evidence: dragging the scale left changes 1785 to 1851 while the needle stays centered; the 1785, 1900, and 2026 labels visibly translate beneath it.

## Interaction and Responsive QA

- Timeline drag: passed; dragging the rail left changed 1785 to 1851 while the amber needle stayed centered and the scale moved beneath it.
- Timeline anchor and keyboard input: passed; clicking the translated 1785 anchor returned to 1785, and ArrowRight advanced the focused slider to 1786.
- Globe drag: passed; pointer dragging rotates the Three.js globe.
- Country / province / county controls: passed; county mode is visibly selected and preserves sharp terrain in `/Users/pisell/Documents/chronicle/artifacts/prototype-refined-county-final.png`.
- Mobile layout: passed; the centered needle, moving scale, controls, and spectrum remain present in `/Users/pisell/Documents/chronicle/artifacts/timeline-fixed-needle-mobile-390x844.png`.
- Runtime logs: passed after the final reload; no new browser errors were emitted by the final implementation.
- Production build: passed with Vite; the remaining large-chunk message is an advisory, not a runtime or fidelity defect.

## Residual P3 Notes

- The Three.js bundle remains above Vite's default advisory threshold; route-level or component-level splitting can be considered when production loading performance becomes a priority.

final result: passed
