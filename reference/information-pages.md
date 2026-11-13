# Contact, legal and consent pages

Added 13 November 2026. These pages describe the current preview, not a live
application, email or payment service.

## Routes and design

- `/contact/`: contact topics, the existing official Instagram route, and a clearly
  labeled non-submitting form preview. `?topic=privacy` preselects privacy; only an
  explicit whitelist of topic values is accepted.
- `/terms/`: draft terms with an accessible table of contents.
- `/privacy/`: draft notice describing hosting requests, preview inputs, local
  consent storage and external links.
- `/consent-preferences/`: functional essential-only preference storage and reset.

Peterson Academy's topic-based contact flow, structured legal pages and consent
control informed the organization. Text is original to Swan Academy. Peterson's
business identity, legal terms, support email and response promises were not reused.

Use `src/information.css` with shared `src/styles.css`: original glass monogram,
Inter/Playfair, existing neutral palette, 16px cards and square controls. Policy
content has a 700px reading measure and a desktop contents sidebar. Mobile stacks
the contents above the article; anchors respect the iOS contained scroller.
The original homepage footer row remains intact, with information links below it.
Only the homepage and information-page footers show these links. Application,
status and checkout omit the footer navigation; contextual privacy/terms links
within forms remain. New draft pages are `noindex`.

## Consent behavior

No optional analytics, ad pixels or consent-vendor scripts are installed. Both
optional categories stay disabled and unchecked. No banner or invented trackers
are added merely to populate these controls.

Saving writes only `swan-academy:consent:v1` to localStorage with:

```json
{"version":1,"essential":true,"analytics":false,"advertising":false,"savedAt":"ISO timestamp"}
```

Reset deletes only that key. It does not clear other storage or hosting-provider
logs. The record persists until reset, browser clearing or browser eviction.
Invalid records never enable tracking; storage errors never claim successful
saving. Cross-tab changes update the interface. Without JavaScript, essential-only
browsing remains the default and save/reset controls remain disabled.

This is not a consent manager for future analytics. If optional services are
introduced, implement actual pre-consent script gating, withdrawal and any relevant
consent record requirements, and revise the notice/controls together.

## Details required before live collection or paid enrollment

The owner has not yet supplied these facts. Do not invent them:

- Legal operator's full name, address, country and relevant jurisdiction.
- Dedicated support/privacy email and actual request-handling workflow.
- Final cohort schedule, duration, access period, eligibility and service terms.
- Final price, currency, taxes, payment provider, cancellations and refunds.
- Actual email/application/payment providers, data purposes/legal bases,
  retention periods and relevant international transfer arrangements.

Keep form submission disabled until a real delivery endpoint is connected and
tested. Filling contact inputs currently sends/stores nothing; a disabled submit
button also blocks implicit submission without JavaScript. Do not replace the
preview with a fake success toast. Optional marketing consent remains separate
from application and support communication.

## Verification

`tests/information.spec.js` covers route loading, footer navigation and its absence on enrollment-flow pages, branding,
320–1440px layout, zero external resource requests, contact non-submission,
consent persistence/reset/cross-tab sync, corrupt/blocked storage, no-JavaScript
behavior and iPhone-user-agent contained-scroll anchors. Chromium mobile emulation
does not establish a physical Safari browser-chrome result.
