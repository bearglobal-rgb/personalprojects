# Swan Academy — AI handoff
Source baseline: 827a4d0f77d453ae55a1891917445db7997afd67
Read this first; load BRAND-GUIDELINES.md only as needed, then inspect relevant source.

## Project and source of truth
- Live site: https://bearglobal-rgb.github.io/personalprojects/
- GitHub repository: bearglobal-rgb/personalprojects; source on main; compiled site on gh-pages.
- Existing workspace path: /workspace/personalprojects. A new environment may use a different path.
- Vite 8 / Tailwind 4 / Node 24 / static multi-entry HTML / vanilla JavaScript / Playwright.
- Routes: /, /apply/, /status/, /checkout/. All four must load directly under the /personalprojects/ base path.
- This kit includes exact source, original local assets, fonts, licenses, design tokens and measured styles.
- Use the user's current request and latest source over this frozen snapshot. Avoid loading the entire old chat.

## Owner preferences and approved design
Precise, restrained, warm neutral design; generous spacing; serif editorial headings and clean sans-serif UI.
The owner prefers concrete execution, careful desktop/mobile verification and candid reporting of real limitations.
Do not claim that emulated WebKit proves behavior on a physical iPhone. Do not reinterpret a new question as approval
to undo established design decisions. Routine implementation details can be resolved without repeated clarification.

- Inter Variable + Playfair Display Variable, including real Playfair italic. Mostly weight 400.
- void #050505; panel #0D0D0C; line #272522; heading #F8F5EF; ink #F4EFE6;
  body #B2ABA0; mute #9A9286; label #A8A094.
- 16px outer cards/photos/glass; 12px inner frames; square buttons/inputs; circular dots/avatars.
- Header on all pages: only centered monogram. 40px from 640px; 32px below 640.
  Compact dark glass, 24px blur, 130% saturation, 16px bottom corners. No nav, header CTAs or Back to Academy text.
- Homepage footer: original responsive layout with full Swan Academy wordmark.
  Desktop row; phone centered stack. Do not restore the rejected all-centered desktop footer.
- Section names: THE FOUNDER and WHAT'S INSIDE. Order: hero, Founder, Failure, System, Inside, Offers, Questions, final CTA, footer.
- Status/checkout intro centered. Application intro and entire Next Steps centered only on phones; form left-aligned.
- Status milestones: desktop groups left-aligned; phone groups centered in each grid column with contents left-aligned.
  Every phone status badge is below Application · Black.
- Checkout monogram: 32px, right side, center aligned with Your enrollment.

## Latest motion decisions — essential
Floating banner: Free System outlined, Apply Black filled, equal columns. 420px maximum, 16px corners.
320ms vertical slide. Entrance cubic-bezier(.4,0,.6,1); exit cubic-bezier(.4,0,1,1). No opacity fade.
Keep it rendered until the exit finishes; disable interaction immediately; cancel stale cleanup on reversal.
Hero/offer release: 80% of BOTH page buttons passes header bottom. Hide when a section's first CTA touches the resting
bottom of the banner. Return after offers clear; hide through the final CTA/footer. Same rule desktop/mobile.

Founder mobile priority was explicitly changed to STABILITY OVER EASING.
Current implementation below 1024 uses a zero-height sticky tip at the viewport center and an upward-painted fill
clipped to the rail. There is no mobile scroll timeline, scale animation or settling loop. On iOS, the sticky top offset
subtracts --page-scroll-padding-top. Reduced motion retains sticky geometry; unsupported browsers use direct JS tracking.
Do not restore the earlier mobile easing or sampled view-timeline implementation. Desktop retains 55ms easing with at
most 20px trailing distance. Touch restarts and reversals passed with animation frames paused; Chromium and WebKit
geometry checks passed. Physical iPhone confirmation of this latest revision is still needed.

System: no vertical line; inactive cards .38 opacity. Compact active phase labels return to the phase list; a deliberate
swipe/wheel/key resumes reading. Programmatic scrolling and resize must not reset that selected phase.
Rooms: desktop grid; compact manual scroll-snap carousel; no autoplay.

## Safari limitations and history worth preserving
The owner repeatedly reported text reappearing in the status-bar area during rapid scrolling.
Current iOS solution uses a fixed native .page-viewport with a stationary clip; page-scroll.js selects the active scroller.
Never bypass this abstraction in new scroll/anchor/modal work. Avoid per-scroll JS clipping.
Content fades into black near the top using a gradient, not visible cloud blur or particles.

Attempts to extend the narrow header glass into physical Safari clock/status-bar chrome were unsuccessful.
The current implementation retains this visible boundary; full extension remains unresolved. Do not claim this has been solved.
Root canvas/glass continuation rules remain in code; they are not proof of physical browser-chrome coverage.
iOS contained scrolling can keep browser controls visible. Physical Safari verification is still required for changes here.

## Product state: all previews
- Free System is an emailed roadmap, not free community/academy membership.
- Signup does not send/store email; application does not submit/store answers.
- Status query states are examples, not real decisions or authorization.
- Checkout has disabled visual fields/button, no Paddle SDK, and no live payment route.
- The US$350 one-time price is illustrative; final price/currency/tax remain unresolved.
- Intended future integrations: Brevo signup/delivery; private application/review/status backend; Paddle checkout.
  See reference/black-application-integration.md before implementation.
- Do not invent testimonials, proof, seat availability, delivered emails or payment success.

## Assets
Preserve the original SVG masters. Header/footer/site marks use a CSS mask tinted to ink.
Do not alter the Founder immersion photo outside the approved laptop-screen composite. Original, screen layer,
composite and exact transform reference are included. Other original photographs still have remote URLs.
The full kit is portable source, not a complete offline archive of those remote photos.

## Working and verification
1. Check git status and current revision before edits. Preserve existing work.
2. Read the relevant files and exact brand recipes; do not recreate from memory or screenshots.
3. Implement the requested scope, build, and run meaningful relevant Playwright checks.
4. Test breakpoint changes, scroll reversals, reduced motion, keyboard behavior and all affected routes.
5. Explain any physical-device limitation honestly. Ask for a physical iPhone check when needed, without claiming it passed.
6. Prior workflow publishes the compiled build to gh-pages after validation and verifies both deployment completion and
   live asset bytes. A successful git push alone does not mean the site is live.
7. A previous Pages publication timed out and its failed-job retry stuck in the queue. A fresh publication of the same
   tested tree subsequently succeeded. Check the actual run state before blindly rerunning or rewriting code.
8. Brand files are available at https://bearglobal-rgb.github.io/personalprojects/brand-kit/. Keep them updated when approved design decisions change.

Commands: npm ci --no-audit --no-fund; npm run dev; npm run build; npm test.
Playwright expects /usr/bin/chromium unless CHROMIUM_PATH is set.
Desktop WebKit is useful supplementary coverage, not an iPhone browser-UI emulator.

## New-chat starter
Continue maintaining Swan Academy from the attached kit and the latest repository.
Read AI-HANDOFF.md first. Treat BRAND-GUIDELINES.md, design-tokens.json, and the source as the design reference.
Preserve the approved layout, copy, preview-only behavior and current desktop/mobile motion decisions.
Inspect the current branch before making changes; the kit is a versioned snapshot.
My next requested adjustment is: [describe one task here].
