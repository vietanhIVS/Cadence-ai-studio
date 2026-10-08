# Mobile navigation and Schedule dates

All four main tabs share a fixed glass dock at widths up to 650px. It appears for two seconds on opening a tab, appears on scrolling in either direction or a bottom-edge gesture, and hides after 1.5 seconds of inactivity. Pointer holds and keyboard focus keep it available. Tab key and the screen-reader Show navigation action reveal it on short pages too. Scroll handling uses passive listeners and one animation-frame callback, with DOM visibility changes rather than React state updates per pixel.

Only transform/opacity change when hiding. The dock becomes inert while hidden. Its measured height, a 28px content allowance, and the safe-area inset determine permanent page/scroll padding. Modern dynamic viewport sizing and visual-viewport resize handling keep the fixed dock reachable when the browser viewport changes. Reduced-motion preferences remove the animation.

The selected date remains independent from Today. Back to Today is shown only when they differ; it changes the selected date and reveals today's cell if the strip overflows. These controls send no training writes. Today has its own aria-current date marker and a subtle border when unselected. Completion checks remain independent. Calendar counts use a dumbbell and number, with 99+ for larger counts and the full count in the accessible date label.

Recent Workouts keeps every record in descending finish-time order, with no display-count cap. The final record can scroll above the visible dock.

Typography uses locally served Plus Jakarta Sans variable WOFF2 files with Latin, extended Latin and Vietnamese coverage under the included SIL Open Font License. Body copy defaults to 500, main headings to 700, and KUDOS/CYCLE COMPLETE to 800 with 0.05em tracking.

Validation: tests/mobile-schedule.ui.mjs covers Chromium and WebKit at 375/390/430px, changing viewport heights, 1/2/7 records, idle/scroll/hold/tab behavior, stable layout, font loading and date navigation without writes. This emulates viewport changes; it does not operate a physical iPhone's browser toolbar.
