# Schedule and Stop program glass UI

Schedule now uses a fixed pale blue gradient canvas with broad, subtle radial light fields. Calendar, daily workout, cycle, onboarding and post-workout cards share translucent glass, 20px blur, saturation, white borders and inset highlights. Existing layout and actions remain in place. Styling is scoped to Schedule; other pages keep their existing presentation.

The selected navigation tab and calendar day use white content on blue gradients. The selected cycle position follows the calendar's chosen occurrence, including rest days, and exposes `aria-current="step"`. Planned status has its blue glass badge and glowing dot. Dark mode, keyboard focus indicators, reduced motion and a no-backdrop-filter fallback are included.

The dedicated Stop program dialog uses a single column, a warning icon and two 44px minimum actions: Cancel left, red Stop program right. Cancel receives initial focus. Escape and backdrop clicks dismiss without changing data. The existing distinct messages and stop rules for today's schedule, an active workout and a future schedule are preserved. Dismissal is blocked while the confirmed save is pending. Other confirmation dialogs retain their existing behavior.

## Contrast

WCAG relative luminance was calculated for text/background colors, checking both gradient endpoints and conservative alpha composites. The canvas estimate includes two overlapping blue radial fields at their maximum 8% opacity. Regular text meets AA (4.5:1); several combinations also meet AAA (7:1), but the white/blue and white/red buttons are AA rather than AAA.

| Combination | Ratio |
| --- | ---: |
| White / brand blue #2563EB | 5.17:1 |
| White / deep blue #1D4ED8 | 6.70:1 |
| White / weekly dark blue #1E40AF | 8.72:1 |
| Navigation gray / light navigation glass | 4.73:1 |
| Modal body / light modal glass with dimmed backdrop | 5.34:1 |
| White / red #DC2626 | 4.83:1 |
| Dark-mode secondary text / dark canvas | 9.32:1 |

The supplied #EF4444 would produce only 3.76:1 against white; the red action uses #DC2626–#B91C1C instead. Canvas metadata uses #4C5D73 and unselected navigation/week labels use #5B6B82, ensuring sufficient contrast over translucent backgrounds. Cycle numbers retain full text opacity.

## Verification

- TypeScript and production build.
- `tests/schedule-glass.ui.mjs`: selected states; glass properties; 320, 390, 668, 982 and 1440px layouts; light/dark mode; reduced motion; safe initial focus; Cancel/Escape/backdrop dismissal; calendar navigation, Today/date picker, Manage schedule and Individual set targets; confirmed stop, history/program retention, active workout termination and future schedule cancellation.
- Existing schedule and end-program domain regressions: 13 passing tests.
- Existing post-workout Schedule UI checks: Kudos, partial completion, History navigation, dismissal persistence and next-workout scheduled-date enforcement.

All browser checks use isolated mock data.
