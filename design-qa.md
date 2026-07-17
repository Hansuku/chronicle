# Design QA — 手绘全球历史疆域版

**Source visual truth**

- Map style: `/Users/pisell/.codex/generated_images/019f6e1a-fd28-72f2-9c8b-a7a73d300a3c/exec-6bfa94ef-02c4-49ad-9354-05cc78d7f10e.png`
- Page layout: `/Users/pisell/.codex/generated_images/019f6e1a-fd28-72f2-9c8b-a7a73d300a3c/exec-5148b941-975f-4b35-a08d-40b17893aec2.png`

**Implementation evidence**

- Screenshot: `/Users/pisell/Documents/chronicle/artifacts/atlas-implementation-final-1440x1024.png`
- Viewport: 1440 × 1024
- State: 1785 年，疆域地图模式；殖民地与事件图层开启；文明指标关闭；大不列颠王国与清帝国对照。
- Full-view comparison: `/Users/pisell/Documents/chronicle/artifacts/design-qa-full-final.png`
- Focused map comparison: `/Users/pisell/Documents/chronicle/artifacts/design-qa-map-final.png`
- Focused timeline and spectrum comparison: `/Users/pisell/Documents/chronicle/artifacts/design-qa-lower-final.png`

## Findings

- No actionable P0/P1/P2 mismatch remains.
- Fonts and typography: the system Songti/PingFang Chinese stacks carry the manuscript display voice while keeping dense labels and analytical copy legible without bundling oversized webfonts. Hierarchy, line height, wrapping, truncation, and optical weight match the two references at the target viewport.
- Spacing and layout rhythm: the global map remains the dominant region; the left layer rail, right global situation brief, fixed-center timeline, and lower civilization spectrum follow the selected third layout. Persistent controls remain visible at 1440 × 1024 with no viewport overflow.
- Colors and visual tokens: deep navy paper, aged amber ink, mineral cyan, rust, and sage are consistently mapped to the first reference's restrained hand-drawn atlas language. Contrast remains sufficient for interactive labels without turning the map into a bright strategy-game surface.
- Image quality and asset fidelity: the generated 2048 × 1024 paper texture is crisp, low-contrast, and free of invented text or logos. Live D3/TopoJSON geometry supplies the map rather than a static screenshot, so historical territory layers can change while retaining the source art direction.
- Copy and content: the page consistently describes global, time-synchronized country and polity borders. London and Guangzhou remain example events only; search, insights, layer labels, and comparison choices all communicate worldwide scope.

## Comparison history

1. Pass 1 found two P2 quality issues: the 1785 view clipped the earliest anchor at the far left of the draggable scale, and duplicate world-feature keys produced a runtime warning.
2. Fixes: expanded the visible timeline span so 公元前 3400 through 2026 remains visible around the 1785 center state; made map feature keys unique.
3. Post-fix evidence: `design-qa-full-final.png` and `design-qa-lower-final.png` show the complete range around the stationary center needle. A fresh browser tab rendered the final view with zero console errors.

## Primary interactions tested

- Dragged the whole timeline scale from 1785 toward 1900 while the center needle stayed fixed; the selected year changed continuously and the global territory layer switched to the 1900 state.
- Jumped directly between dated anchors.
- Toggled colonial territory, event, and civilization-indicator layers.
- Searched the active historical layer for 奥斯曼帝国 and selected the result.
- Entered and exited 文明对照 mode.
- Switched comparison polities and verified the spectrum content updated.
- Checked a fresh browser render for console errors: none.

## Follow-up polish

- P3: the live vector coastlines are intentionally cleaner than the most distressed ink edges in the first mock; a later pass could add a very subtle data-safe roughening treatment if stronger manuscript imperfection is desired.

## Final result

final result: passed
