# Swan Academy — Brand & Interface Blueprint
Version 1.3 · Source baseline: 0e1d6975b7efa1fcdcbf1a062c771238d37d38b3

This is an audited specification of the existing Swan Academy website, not a redesign.
It combines current source values, browser measurements, and the latest decisions in this project.
The source snapshot is included so another designer or AI can reproduce details that a prose summary cannot encode.

## 1. How to use this blueprint

- Use the PDF as a visual reference; use this Markdown file and design-tokens.json for implementation.
- Use computed-styles.json for measured fonts, line heights, colors, spacing and element styles at 390, 640, 768, 1024 and 1440px viewport widths.
- Use source-snapshot/ as the exact implementation baseline. It contains the HTML, CSS, JavaScript, supplied local assets, package lock, tests, and build scripts. It excludes dependencies, build output, credentials and Git history.
- Use AI-HANDOFF.md to start a new conversation. That file summarizes current decisions and unfinished work with much less context than the old chat.
- Measurements are CSS pixels at 100% browser zoom and the default 16px root size. Device pixels and PDF points are different units.
- Computed-style snapshots cover the default pages and the approved status example; they do not enumerate every dynamic state. Use source recipes for other states. Measurements are representative, not declarations of fixed page height. Content, fonts, viewports, zoom and safe areas affect geometry.
- Where the guide and a future source revision differ, inspect the revision before changing anything. User instructions in the new session can supersede this snapshot.

### Brand direction observed in the site

Swan Academy presents English mastery through deliberate execution and a sequential system.
Its interface is restrained, editorial and serious: near-black surfaces, warm ivory type,
large Playfair Display headings, quiet Inter text, generous space and thin borders.
“Black” is the selective guided cohort within Swan Academy, not a separate visual identity.

This description is derived from the website; it is not a new mission statement, positioning exercise,
or comprehensive print/social identity system. Do not invent brand colors, promises or offers from it.

## 2. Identity and supplied artwork

Use the original master SVGs. Never redraw the monogram as a typed A, substitute a font glyph, stretch the artwork,
add an outline, or replace it with an AI-generated imitation.

| Asset | Use |
|---|---|
| Swan-Academy-Monogram-White-Master.svg | Source monogram for dark surfaces; website uses it as a CSS mask tinted to ink |
| Swan-Academy-Monogram-Black-Master.svg | Supplied black master; available for light-surface use, not a new website light theme |
| Swan-Academy-MainBanner-White-Master.svg | Supplied full wordmark/banner master; preserve original proportions |
| Swan-Academy-MainBanner-Black-Master.svg | Supplied dark full wordmark/banner master |
| Swan-Academy-Favicon.svg / .ico | Existing framed white monogram on rounded black square |

Monogram viewBox: 0 0 623.0459 556. Full banner viewBox: 0 0 1538.1343 223.46167.
The square CSS monogram box uses contain sizing; the artwork itself is not stretched to a square.

**Loading requirement**
Header loading: inline the original monogram master in the shared CSS with Vite's ?inline flag. The SVG exceeds the default automatic-inlining limit. All four website pages must render the mark without a separate SVG request or JavaScript. Preserve the original paths, currentColor mask, size and placement.

**Current placements**
- Header, every page: monogram only, centered. 40×40px at widths ≥640; 32×32px below 640.
- Header has no “Swan Academy” text, nav words, CTA buttons, menu, or “Back to Academy” text.
- Header logo is clickable: home anchors to #top; application/status/checkout return home.
- Footer: retain monogram + “Swan Academy”. Monogram 32px; live serif wordmark 18px. This is the current site lockup, not a raster recreation of the full-banner master.
- Signup dialog: live lockup using the same monogram and serif name.
- Checkout summary: 32px monogram at upper-right, vertically centered against “Your enrollment”.
- Preserve existing clear space: header has 24px side padding; footer/logo gap 12px. A universal external clear-space rule or print minimum size has not been formally approved.

## 3. Color system

| Token | Hex | Role |
|---|---|---|
| void | #050505 | Page background, input interiors, deepest surface |
| panel | #0D0D0C | Cards, dialogs and flow-page panels |
| line | #272522 | Quiet 1px dividers and standard panel borders |
| heading | #F8F5EF | Main heading text |
| ink | #F4EFE6 | Logo, primary UI text, filled CTA surface, active marks |
| body | #B2ABA0 | Reading copy |
| mute | #9A9286 | Supporting copy, metadata, secondary labels |
| label | #A8A094 | Homepage section labels, offer labels and founder credit |
| positive | #8FAE96 | Small approved/enrolled status symbol only |
| negative | #C28B86 | Small not-accepted status symbol only |

The status colors are semantic accents. Do not turn them into large decorative backgrounds or brand accents.
Do not infer a gold accent from the warm gray palette. Use the exact hex values above.

Common derived values: panel at 40% opacity for subdued cards; ink at 35% for emphasized card borders;
ink at 22% for glass borders; ink at 32% for the floating outlined button; ink at 6% for its hover fill.
Keep source color-mix declarations where they exist. Do not approximate mixed colors with arbitrary grays.

Core headings and body text are deliberately brighter than secondary text. System inactive-card opacity
is intentionally 0.38; do not copy that low-opacity treatment onto essential instructions or input labels.
This blueprint preserves the current design; it does not certify the entire website against an accessibility standard.

## 4. Typography

**Primary families**
- Display/headings: Playfair Display Variable. Use the actual italic font for emphasized words/phrases.
- Body, UI, labels and controls: Inter Variable.
- Core measured headings, body copy and controls use weight 400. Preserve explicit exceptions in source;
  do not make the whole interface bold as a redesign.
- Serif fallback: “Playfair Display”, ui-serif, Georgia, “Times New Roman”, serif.
- Sans fallback: Inter, ui-sans-serif, system-ui, sans-serif.
- Fontsource variable-font files are bundled locally. Latin WOFF2 files and both OFL licenses are in assets/.
  Additional language subsets should come from the same font families, not replacement fonts.

**Responsive formulas and exceptions**
- Hero headline: 2.6rem = 41.6px below 640; 60px at 640–767; 72px at ≥768.
  Line height 1.08; letter spacing −0.025em. The second phrase is true italic.
- Main Founder/Failure/Rooms/Offers heading: 36 / 48 / 60px at the same three bands; line height 1.1.
- System intro heading stops at 48px from 640; it does not grow to 60px.
- FAQ heading: 36px / 40px line height at all measured widths.
- Final CTA headline: 36px below 640, 48px above; line height 1.25.
- Founder chapter headings below 1024: 24px / 33px. At ≥1024: 32px / 44px.
- Founder chapter body below 1024: 15px / 24.75px. At ≥1024: 18px / 29.25px.
- System-card heading: 24px / 33px below 640; 27.2px / 37.4px from 640.
- Application intro: clamp(36px, 3.6vw, 48px), overridden to 36px below 640; line height 1.15, tracking −0.025em.
- Status/checkout intro: clamp(36px, 5vw, 52px); line height 1.15, tracking −0.025em.
- Checkout “Black” product heading remains 52px / 59.8px, including phones.
- Do not flatten these exceptions into one universal heading size.

**Tracking / case**
- Homepage section eyebrow: Inter 11px; .32em; uppercase.
- Offer/category label: 11px; .28em; uppercase (specific source labels can differ).
- Founder credit: 12px; .12em; uppercase.
- Hero/offer/final CTA: 12px; .18em; uppercase.
- Floating CTA: 11px; .16em; uppercase.
- Flow-page eyebrow: 10px; .25em; uppercase.
- Submit/payment controls: 11px; .18em; uppercase.
- Status badge: 10px; .12em; uppercase.
- Footer socials: 12px; .16em; uppercase.
- Body copy generally has normal tracking. Do not apply spaced capitals to paragraphs.

### Measured homepage type
Each cell is font size / computed line height, in px. All listed roles are weight 400.
| Role / selector key | <640 (390 sample) | 640–767 | 768–1023 | 1440 sample |
|---|---:|---:|---:|---:|
| hero.heading | 41.6 / 44.928 | 60 / 64.8 | 72 / 77.76 | 72 / 77.76 |
| hero.eyebrow | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |
| hero.body | 16 / 26 | 18 / 29.25 | 18 / 29.25 | 18 / 29.25 |
| hero.primary | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| hero.secondary | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| hero.credit | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| section.eyebrow | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |
| section.heading | 36 / 39.6 | 48 / 52.8 | 60 / 66 | 60 / 66 |
| founder.heading | 24 / 33 | 24 / 33 | 24 / 33 | 32 / 44 |
| founder.body | 15 / 24.75 | 15 / 24.75 | 15 / 24.75 | 18 / 29.25 |
| system.heading | 36 / 39.6 | 48 / 52.8 | 48 / 52.8 | 48 / 52.8 |
| system.card.heading | 24 / 33 | 27.2 / 37.4 | 27.2 / 37.4 | 27.2 / 37.4 |
| system.card.body | 15 / 24.375 | 15 / 24.375 | 15 / 24.375 | 15 / 24.375 |
| rooms.heading | 36 / 39.6 | 48 / 52.8 | 60 / 66 | 60 / 66 |
| rooms.card.heading | 24 / 33 | 24 / 33 | 24 / 33 | 24 / 33 |
| offer.heading | 30 / 36 | 30 / 36 | 30 / 36 | 30 / 36 |
| offer.label | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |
| faq.heading | 36 / 40 | 36 / 40 | 36 / 40 | 36 / 40 |
| faq.question | 20 / 28 | 20 / 28 | 20 / 28 | 20 / 28 |
| faq.answer | 16 / 26 | 16 / 26 | 16 / 26 | 16 / 26 |
| final.heading | 36 / 45 | 48 / 60 | 48 / 60 | 48 / 60 |
| footer.name | 18 / 28 | 18 / 28 | 18 / 28 | 18 / 28 |
| footer.social | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| footer.copyright | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| floating.button | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |
| signup.heading | 32 / 38.4 | 32 / 38.4 | 32 / 38.4 | 32 / 38.4 |
| signup.body | 15 / 24.75 | 15 / 24.75 | 15 / 24.75 | 15 / 24.75 |

### Measured application type
| Role / selector key | <640 (390 sample) | 640–767 | 768–1023 | 1440 sample |
|---|---:|---:|---:|---:|
| intro.heading | 36 / 41.4 | 36 / 41.4 | 36 / 41.4 | 48 / 55.2 |
| intro.eyebrow | 10 / 15 | 10 / 15 | 10 / 15 | 10 / 15 |
| intro.lead | 16 / 27.2 | 17 / 28.9 | 17 / 28.9 | 17 / 28.9 |
| process.heading | 19 / 28.5 | 21 / 31.5 | 21 / 31.5 | 21 / 31.5 |
| process.body | 12 / 19.8 | 13 / 21.45 | 13 / 21.45 | 13 / 21.45 |
| panel.heading | 32 / 38.4 | 36 / 43.2 | 36 / 43.2 | 36 / 43.2 |
| fieldset.legend | 23 / 34.5 | 23 / 34.5 | 23 / 34.5 | 23 / 34.5 |
| field.label | 14 / 22.4 | 14 / 22.4 | 14 / 22.4 | 14 / 22.4 |
| field.input | 16 / 24 | 16 / 24 | 16 / 24 | 16 / 24 |
| field.help | 13 / 21.45 | 13 / 21.45 | 13 / 21.45 | 13 / 21.45 |
| submit | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |

### Measured status type
| Role / selector key | <640 (390 sample) | 640–767 | 768–1023 | 1440 sample |
|---|---:|---:|---:|---:|
| intro.heading | 36 / 41.4 | 36 / 41.4 | 38.4 / 44.16 | 52 / 59.8 |
| card.heading | 30 / 36 | 36 / 43.2 | 36 / 43.2 | 36 / 43.2 |
| card.body | 16 / 27.2 | 16 / 27.2 | 16 / 27.2 | 16 / 27.2 |
| badge | 10 / 15 | 10 / 15 | 10 / 15 | 10 / 15 |
| stage.label | 12 / 18 | 12 / 18 | 12 / 18 | 12 / 18 |
| stage.detail | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |
| payment | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |

### Measured checkout type
| Role / selector key | <640 (390 sample) | 640–767 | 768–1023 | 1440 sample |
|---|---:|---:|---:|---:|
| intro.heading | 36 / 41.4 | 36 / 41.4 | 38.4 / 44.16 | 52 / 59.8 |
| product.heading | 52 / 59.8 | 52 / 59.8 | 52 / 59.8 | 52 / 59.8 |
| product.caption | 15 / 25.5 | 15 / 25.5 | 15 / 25.5 | 15 / 25.5 |
| payment.heading | 30 / 36 | 32 / 38.4 | 32 / 38.4 | 32 / 38.4 |
| payment.body | 15 / 25.5 | 15 / 25.5 | 15 / 25.5 | 15 / 25.5 |
| provider.heading | 14 / 21 | 14 / 21 | 14 / 21 | 14 / 21 |
| pay | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 | 11 / 16.5 |

The JSON inventory provides exact selectors, family, tracking and color for every row.
Fluid heading formulas above take precedence over treating the 1440px samples as universal desktop constants.

## 5. Responsive layout, spacing and geometry

| Rule | Value |
|---|---|
| sm breakpoint | 640px |
| md breakpoint | 768px |
| lg breakpoint | 1024px |
| Wide content maximum | 1152px |
| Hero content maximum | 896px |
| Final CTA content maximum | 768px |
| Common reading-copy maximum | 576px |
| Main horizontal gutters | 20px below 640; 32px from 640 |
| Ordinary section vertical padding | 96px below 640; 128px from 640 |
| Hero top/bottom padding | 80/96px below 640; 112/128px at 640–1023; 152/88px at ≥1024 |
| Hero minimum height | calc(100svh − 74px − safe-area-top), with 100vh fallback |
| Compact Founder/Rooms max width | 608px |
| Application/checkout compact max width | 700px |
| Common outer card/photo/glass radius | 16px |
| Inner frames and preview strips | 12px |
| Buttons, fields, status badges | Square corners: 0px |
| Avatars and circular markers | Circular |
| Standard border/divider | 1px |

“Mobile” is not one breakpoint: phone header/form rules change below 640, while the compact Founder,
System and Rooms layouts and single-column application/checkout change below 1024.
At 640–1023, the header uses the 40px monogram while the Founder remains compact.

Common spacing values used by the site are 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 112 and 128px.
These are recurring values, not an instruction to round every source dimension to a universal scale.
Preserve component exceptions such as 9px dots, 22px field groups and the 72px header interior.

**Footer**
Homepage only. Maximum width 1152px; horizontal padding 20/32px; vertical padding 48px; gap 32px.
Below 640: centered vertical stack (logo/name, socials, copyright). From 640: horizontal row with logo left,
socials centered in the row and copyright right. Social-link gap 24px; wordmark gap 12px.
Application, status and checkout have contextual links rather than the full homepage footer.

**Photography**
Use existing photographs and crops. Main Founder photos: 4:5 at ≥1024; 4:3 below 1024.
Compact photo width 88%, maximum 320px; alternate left/right while text remains consistently aligned.
Large photos/cards use 16px corners. Founder portrait is grayscale.
Do not regenerate or edit the Founder immersion photograph outside the already approved laptop-screen composite.
The exact original, screen layer, composite and transform reference are in the snapshot.
Some other photos remain external URLs; the kit is not a complete offline photograph archive.

## 6. Components and states

**Cards**
Outer surfaces usually use panel, a 1px line border and 16px radius.
Subdued cards use panel/40; emphasized cards use panel and ink/35 borders.
Offer/comparison padding: 32px below 640, 40px above. System cards: 24px below 640, 32px above.
Inner mock-interface frames use 12px corners. Avoid adding drop shadows to every card;
the pronounced shadows belong to floating glass components.

**Buttons**
- Hero/final free CTA: filled ink with void text; Black CTA outlined ink.
- Offer cards: free CTA outlined; Black CTA filled.
- Floating banner: Free System outlined; Apply Black filled.
- Hero/final controls: 32px horizontal and 14px vertical padding, 12px/18px type;
  filled height computes to 46px and outlined to 48px because of the border.
- Offer controls: 24px horizontal and 14px vertical padding.
- Floating controls: minimum height 48px; 12px vertical / 8px horizontal padding; 11px type.
- Application/status/checkout action: minimum height 50px; 14px / 20px padding; 11px type.
- Signup action: minimum height 52px; 14px padding; 11px type.
- Filled homepage CTA hover opacity: .85. Floating Apply Black hover opacity: .85 with 180ms transition.
- Floating Free System border ink/32, hover border ink and background ink/6; 180ms transition.
- Disabled preview submission/payment controls: opacity .55; default cursor.
- No pill-shaped CTAs; glass-container rounding must not be copied onto the buttons.

**Focus and controls**
Visible keyboard focus uses a 1px ink outline, offset 5px; application fields offset 3px.
Input/select text is 16px. Labels are 13–14px depending on the component.
Application fields: minimum height 48px; 12px padding; 1px mute border; void fill; square corners.
Application textarea: minimum height 132px; vertical resize.
Signup input: minimum height 52px; 12px/16px padding.
Preserve native labels, dialog focus behavior, keyboard access and reduced-motion handling.

**Signup dialog**
Maximum width 480px or viewport minus 32px; maximum height viewport minus 32px.
Panel fill, line border, 16px corners; padding 32px or 24px below 640.
Backdrop: black at .8 opacity with 4px blur. Close target: 44×44px.
The dialog is a visual signup preview; it does not currently store or deliver email.

**FAQ**
Native details/summary interaction. Question: Playfair 20px / 28px.
Answer: Inter 16px / 26px. Rows use 24px vertical padding and quiet separators.
The plus rotates 45 degrees when open. Preserve the native interaction and keyboard behavior.

## 7. Glass surfaces: exact recipes

Use both backdrop-filter and -webkit-backdrop-filter for the glass components.

### Desktop/tablet header panel
~~~css
border: 1px solid rgb(244 239 230 / .22);
border-top: 0;
border-radius: 0 0 16px 16px;
background:
  linear-gradient(135deg, rgb(244 239 230 / .08), transparent 65%),
  rgb(13 13 12 / .8);
backdrop-filter: blur(24px) saturate(130%);
-webkit-backdrop-filter: blur(24px) saturate(130%);
box-shadow:
  inset 0 -1px 0 rgb(244 239 230 / .05),
  0 8px 24px rgb(0 0 0 / .2);
~~~

Header interior minimum height: 72px. Side padding: 24px.
Panel widths: 90px from 640, 82px below 640. Bottom border adds 1px to the normal header height.
Top position and phone interior incorporate the safe area; do not hardcode a particular iPhone's inset.

### Phone header paint
The phone header uses an isolated ::before panel extending above the viewport:
inset: −100vh −1px −1px; z-index: −1; same border and bottom corners.
Its background differs from desktop:
~~~css
background:
  linear-gradient(90deg, rgb(244 239 230 / .04), transparent),
  rgb(13 13 12 / .8);
backdrop-filter: blur(24px) saturate(130%);
~~~
Use the complete safe-area and root-canvas rules in source-snapshot/src/styles.css.
Attempts to extend this into physical Safari browser chrome failed; the visible boundary remains unresolved.
Do not promise that CSS can force the glass through the clock/status-bar area.

### Floating CTA panel
~~~css
width: min(420px, calc(100% - 32px));
border: 1px solid rgb(244 239 230 / .22);
border-radius: 16px;
background:
  linear-gradient(135deg, rgb(244 239 230 / .08), transparent 65%),
  rgb(13 13 12 / .8);
backdrop-filter: blur(24px) saturate(130%);
-webkit-backdrop-filter: blur(24px) saturate(130%);
box-shadow:
  inset 0 1px 0 rgb(244 239 230 / .1),
  0 12px 40px rgb(0 0 0 / .35);
~~~
Two equal columns. At ≥640: 12px padding, 12px gap, bottom 24px + safe-area-bottom.
Below 640: 10px padding, 10px gap, bottom 12px + safe-area-bottom.
Do not expand it to a page-width strip or copy Peterson Academy's pill buttons.

Other blur recipes: signup backdrop 4px; the small course-preview overlay in What's Inside uses
Tailwind 4 backdrop-blur-sm = 8px, not the 4px value from older Tailwind versions.

## 8. Header fade and Safari behavior

Content fades into the page background near the top; it should not remain as visible blurred text.
The fade is an ordinary background overlay. No particles, noise cloud, blur filter, or hard visible rectangle.
Its total height is 128px + safe-area-top. It stays opaque through 48px + safe-area-top,
then uses the following opacity stops (each listed y value also receives safe-area-top):
48:1; 58:.97; 68:.88; 78:.71; 88:.5; 98:.29; 108:.12; 118:.03; 128:0.

Layer order: skip link 100; header 50; top cap 46; fade 45; floating banner 40; native dialog in top layer.
Decorative overlays must not intercept input.

All pages use viewport-fit=cover and a #050505 theme color.
iOS currently scrolls a fixed .page-viewport with native clipping at 48px + safe-area-top;
its height is 100dvh, top padding is 73px + safe-area-top, scroll-padding-top 96px + safe-area-top.
Root scrolling is locked on iOS; ordinary document scrolling remains on desktop/Android.
Keep timelines, floating CTA triggers, anchor scrolling and dialog scroll restoration using the active scroller
from page-scroll.js. Do not reintroduce per-scroll JavaScript clipping.
This containment may keep Safari controls visible instead of permitting normal document-scroll collapse.

Historical status: attempted status-bar glass continuation was unsuccessful on the owner's phone.
The root strip remains in source; it is an implementation experiment, not a guaranteed design feature.
Physical Safari behavior is not proven by desktop WebKit or mobile emulation.

## 9. Motion and interactive behavior

### Floating CTA
Duration: 320ms. Entrance: cubic-bezier(.4, 0, .6, 1). Exit: cubic-bezier(.4, 0, 1, 1).
It slides vertically; there is no opacity fade. Hidden transform:
translate(-50%, calc(100% + bottom-offset + 40px)); visible transform: translate(-50%, 0).

Keep rendering enabled until the transform finishes. Input and accessibility are disabled immediately on exit.
A duration-based fallback handles missing transition-end events; parse CSS time values as seconds or milliseconds correctly.
Reversing an exit cancels its old cleanup. Reduced motion removes the animated transition.

**Visibility rule, all viewport widths**
1. Hidden on the hero until 80% of BOTH hero buttons has passed behind the header's bottom.
2. Visible through reading sections.
3. Hide when the first Choose Your Next Step button touches the banner's resting bottom edge.
4. Return only after 80% of BOTH offer buttons has passed behind the header.
5. Visible through Questions.
6. Hide when the first final-section CTA touches the banner; on phones this is Get the Free System.
7. Stay hidden through the footer. Scrolling upward reverses the relevant conditions.
Use the resting banner edge rather than the moving animation rectangle; allow 1px for subpixel rounding.

### Founder line
Current priority: stability over softness on mobile AND desktop. Do not restore the removed easing.
- All widths: a zero-height native sticky tip at 50dvh, with a 100vh upward-painted pseudo-element.
  The rail uses overflow: clip, keeping the fill inside its endpoints without introducing a nested scroller.
  No scale animation, scroll timeline, or time-based settling is used.
- On iOS, subtract --page-scroll-padding-top from the sticky top offset to account for the padded contained scrollport.
- Reduced motion uses the same direct sticky geometry. Without sticky/overflow-clip support, use direct JS tracking.
- Touch-start and direction-reversal regression tests keep animation frames paused to verify the tip does not need JS to catch up.
- Desktop now uses the same native sticky geometry as mobile: no easing, trailing distance or settling loop.
- Desktop and compact lines end at the current viewport-center reading position, clamped to the rail endpoints.
- Marker dots: 9px, fill/unfill when the chapter marker crosses the viewport center; color/border transition 300ms ease.
- Desktop rail: centered, 32px top/bottom inset. Compact rail: left 4px, 16px inset.
- The owner has confirmed zero lag on mobile. The desktop extension passed upward wheel reversals from the rail end
  with animation frames paused, plus mobile touch, reduced-motion and fallback checks.

### System
No vertical line. Active card opacity 1; inactive .38; inactive panel/40; active panel; active ink/35 border.
Card state transition: opacity/border/background 500ms. The currently selected phase and number track reading position.
Below 1024, clicking an active phase label returns to that phase's list, with cards dimmed until a deliberate vertical
swipe/wheel/key resumes reading. Resize, automatic scrolling and viewport changes must not clear that choice.

### Rooms / What's Inside
Five cards. Desktop grid; below 1024 a native horizontal scroll-snap carousel with next-card preview.
Compact cards: 88% width, maximum 352px; 16px gap; track maximum 608px.
Arrow targets 44px; dot targets 32×44px; visual dots 7px. No auto-advance.
Left/Right, Home/End, arrows and dots must work. Reduced motion disables animated navigation.

## 10. Application, status and checkout

**Application**
Desktop: max 1152px; columns .85fr / 1.15fr; gap 72px; padding 88px 32px 112px.
Intro is sticky at 120px. At <1024: max 700px; one column; gap 40px; padding top/bottom 56/72px.
Below 640: 20px sides; top 40px; intro AND entire Next Steps centered. The form remains left-aligned.
Panel: 36px padding desktop; 24px vertical / 20px horizontal phone; 16px corners.
Next Steps becomes three columns below 1024, with 20px gap, reduced to 12px below 640.
Fields and copy must remain preview-safe until integrations are configured.

**Status**
Max 1152px; padding 64px 32px 88px; below 640: 40px 20px 64px.
Intro centered at all widths. Preview strip: 12px radius; 20px/24px padding, 20px on phone.
Main card: panel, 16px radius, 36px padding; phone 24px/20px.
Desktop header places the badge opposite Application · Black; phone always places the badge in a dedicated row underneath.
Badge border is square, 7px/10px padding, 9px gap, 10px type; normal symbol 6px.
Approved: muted green dot. Enrolled: muted green check. Not accepted: muted red dot.
Under review: ivory dot with a restrained 2.8s pulse, disabled for reduced motion.
Progress: desktop four columns, left-aligned 72px groups and connectors; mobile two columns with 24px gap,
72px groups centered inside each column, with their dots and text left-aligned within each group. No mobile connectors.
These alignment decisions are explicit; do not center the desktop milestones again.

**Checkout**
Max 1152px; padding 64px 32px 88px. At <1024 max 700px and one column.
Desktop columns .9fr / 1.1fr; 32px gap. Compact gap 24px.
Below 640: page padding 40px 20px 64px. Intro centered at every width.
Summary/payment panel: 32px padding; phone 24px/20px; 16px radius.
Provider mock frame: 12px radius; 24px padding; phone 20px/16px.
Upper-right summary monogram: 32px, centered vertically with Your enrollment.
Payment fields are visual placeholders, not functioning payment inputs.

## 11. Copy, routes and product truth

Public homepage order:
Hero → The Founder → The Failure → The System → What's Inside → Choose Your Next Step → Questions → Final CTA → Footer.

- Keep THE FOUNDER; do not revert to THE ORIGIN.
- Keep WHAT'S INSIDE; do not rename it THE ENVIRONMENT or THE MILIEU.
- There are no centered header navigation links.
- Free System = free emailed 10-Step roadmap; it does not include academy/community membership.
- Black = selective guided cohort; application → review → invitation to pay → enrollment confirmation.
- All homepage Black CTAs route to /apply/. They do not jump straight to payment.
- /apply/, /status/ and /checkout/ are independent static entry points.
- Signup, application, status and checkout are visual previews. No email delivery, application submission,
  private decision service or payment service is connected.
- Status preview query values are demonstrations, never authentication or real decisions.
- US$350 one-time checkout pricing is illustrative. Currency, price and tax treatment require confirmation before launch.
- Brevo and Paddle are intended integration paths, not connected or operational promises.
- Keep 20 seats / founding cohort copy as current copy, but do not invent actual availability or admissions outcomes.
- Keep the existing voice and wording unless asked to change it. Use the approved copy-change reference when comparing originals.
- Future testimonials/proof belong between What's Inside and Choose Your Next Step, only when real material is supplied.

## 12. Preservation rules and acceptance checks

Preserve:
- The original vector logos, original photographs and approved immersion composite.
- The header's monogram-only layout and the restored full-wordmark footer.
- Rectangular buttons and form fields; 16px outer containers and 12px inner frames.
- The exact warm neutral palette and the distinction between heading, ink, body, mute and label.
- Latest mobile Founder tracking and the smooth 320ms banner entrance/exit.
- Preview-only product behavior and honest messaging.
- Keyboard access, focus handling, native forms, responsive layout and reduced-motion support.

Avoid:
- Reintroducing old header words, buttons, Back to Academy or a full-width header bar.
- Restoring the all-centered desktop footer.
- Adding gold gradients, pill CTAs, generic icon packs, particle clouds, heavy card shadows, or new fonts.
- Using artificial opacity fades on the banner or CSS visibility delays that hide it before its exit finishes.
- Restoring a time-eased mobile Founder line to make it “more natural”.
- Claiming Safari UI/status-bar fixes based only on desktop emulation.

Check at 390px, around 640/768/1024 boundaries, and 1440px. Include 320px for overflow.
Test slow and fast scrolling in both directions; banner contact rules; fresh-page and restored-scroll states;
all status preview states; a long status badge; dialog focus/scroll restoration; resize; reduced motion;
and physical iPhone Safari when a browser-chrome or touch-scroll issue is involved.

## 13. Exact source map and maintenance

| Need | Exact source |
|---|---|
| Colors, fonts, glass, fade, global/compact rules | source-snapshot/src/styles.css |
| Home typography, section spacing and component markup | source-snapshot/index.html |
| Founder/System/Rooms behavior | source-snapshot/src/main.js |
| Native iOS scroller and scroll locking | source-snapshot/src/page-scroll.js |
| Floating banner thresholds and rendering lifecycle | source-snapshot/src/floating-cta.js |
| Signup interaction | source-snapshot/src/free-system-signup.js |
| Application styles / fields | source-snapshot/src/application.css and apply/index.html |
| Status styles / example states | source-snapshot/src/application-status.css and application-status.js |
| Checkout layout / placeholders | source-snapshot/src/checkout.css and checkout/index.html |
| Approved photo composition | source-snapshot/reference/immersion-screen.json |
| Accepted copy revisions | source-snapshot/reference/free-system-copy-changes.json |
| Future backend work | source-snapshot/reference/black-application-integration.md |

Source baseline: 0e1d6975b7efa1fcdcbf1a062c771238d37d38b3. Website: https://bearglobal-rgb.github.io/personalprojects/
Repository: https://github.com/bearglobal-rgb/personalprojects

If extending the project, work from the current repository, not an old exported copy, unless this snapshot is intentionally
the starting point. After approved visual changes, update tokens, this guide, the handoff, measurements and source snapshot
together. Record the new commit. An AI's memory is not the canonical design specification.

Some statements in the snapshot README refer to earlier environment limitations or reconstructed source areas.
The audited values and current-decision notes in this guide are more specific; do not treat historical README notes as
evidence that a completed deployment is still pending or that a failed physical Safari experiment is solved.
