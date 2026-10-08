# Schedule background capture

The shared canvas previously painted three gradients on `body` with `background-attachment: fixed`, in light and dark mode. Schedule has no full-screen transformed decorative element. Its other fixed layers are the bounded navigation dock and modal overlays; celebration glow filters are confined to their icons.

The fixed-attachment gradient is the suspected source of the reported iOS Full Page artifact. A native-device reproduction was not available. The canvas now paints on `html` in document coordinates, with the original gradient colors, stops, and ambient glows. Body stays transparent. There are no decorative DOM nodes, transforms, filters, clip paths, viewport-sized textures, or fixed-attachment backgrounds. The gradient spans the document rather than being pinned to the browsing viewport. Cards, layout, spacing, content, and navigation are unchanged.

Print media uses the existing canvas base color without gradient layers. This avoids oversized decorative paint during PDF/print capture. It does not remove content or alter screen styles. Native iOS capture can use a different path than print media; the root-background fix applies to both.

`tests/schedule-background.ui.mjs` checks Chromium and WebKit with 12 workout records, light/dark modes, 375/390/430px widths, scrolling, viewport height changes, full-page screenshots, and print media. It compares all Schedule card geometry/styles and content against the former background and checks that navigation sends no writes. Chromium also generates PDFs.

Desktop WebKit emulation cannot operate a physical iPhone's Safari toolbar or its native Screenshot → Full Page PDF UI. Remaining device verification: open Schedule in iOS Safari, scroll with toolbar expanded/collapsed, capture Screenshot → Full Page, inspect the full PDF in light and dark modes, then confirm the screen layout still matches normal browsing.
