# Swan Academy reconstruction

Static Vite + Tailwind site built from the supplied Swan Academy HTML export,
brand specifications, SVGs, and screenshots. Main-page wording is preserved except
for the offer and application revisions recorded in `reference/free-system-copy-changes.json`,
the homepage navigation/section names below, and the removed language/keyword strip beneath the hero. The hero fills the opening
viewport below the header, keeping the next section below the fold.
The section order is Hero → The Founder → Failure → System → What’s Inside → Choose Your
Next Step → FAQ → Final CTA → Footer. A future Proof/Testimonials section belongs
between What’s Inside and Choose Your Next Step; it is omitted until real material is supplied.
Black CTAs lead to the branded `/apply/` application preview instead of checkout.
Original corner treatments are restored:
rounded cards and photographs, smaller rounded inner frames, and circular avatars
and badges. Buttons retain their original rectangular shape. The Origin timeline has
a scroll-linked line and chapter markers. The System has no vertical line; its numbers,
active cards, and phase still follow scrolling in either direction. Includes native
FAQ disclosures and responsive layouts.
All four headers contain only the centered, clickable monogram at its existing
size (40px desktop, 32px phone), with no wordmark, navigation links, menu, or header CTAs. The homepage footer retains the
Swan Academy wordmark and its original layout: a desktop row and a centered phone
stack, with 32px gaps and 48px vertical padding.
The Founder and What’s Inside section labels remain in place.
A fixed glass-style banner holds Free System and Apply Black, using a 16px radius,
backdrop blur, and safe-area spacing. It fades in once 80% of both hero buttons
have scrolled behind the header, hides at Choose Your Next Step, returns once
80% of both offer buttons have passed the header, and hides at
the final CTA and footer. On desktop, it hides as soon as the final buttons touch
the banner’s bottom edge; the mobile section-based exit remains unchanged.
Scrolling upward reverses these states. Hidden actions
are inert and excluded from accessibility navigation; reduced motion removes
transitions, and without JavaScript the banner stays hidden while page CTAs work.


System phase links center the first card of the selected phase. Below 1024px,
the highlighted card's phase label returns to that phase in the list. While
viewing the list, only the chosen phase is highlighted and all cards are dimmed.
A deliberate vertical swipe, wheel scroll, or scroll key restores normal
position-based highlighting; choosing a phase or step number also exits this mode.
Automatic scrolling and browser viewport changes do not clear the selection.
Desktop card labels remain noninteractive.
Inactive cards use the user-preferred 38% opacity fade; step numerals remain readable.
Active cards keep their stronger border, solid panel, and brighter number. The deeper
card fade is intentional, including its lower inactive-text contrast; scroll behavior is unchanged.

The palette keeps the near-black background and ivory buttons/wordmarks. Headings
use a brighter warm white (`#F8F5EF`), reading text uses `#B2ABA0`, and secondary
text retains `#9A9286`. Homepage section labels, offer labels, and the founder
credit use a slightly brighter `#A8A094` for legibility. Header, footer, and signup monograms use the original SVG
as a CSS mask to match the ivory wordmarks exactly without altering the artwork.
The sticky header is a compact glass panel around the monogram, with 24px side
padding, 24px backdrop blur, and 16px bottom corners. Its top corners stay square.
The floating Apply Black action keeps dark text on its ivory fill.

## Run

The site includes a **visual preview of the email signup**. All free-offer buttons open
a branded on-site dialog; the offer cards and FAQ now describe an emailed system
instead of free academy membership. Submission is deliberately disabled, with no
email storage or delivery claim. The user requested this preview be published
before Brevo and the finished resource are available; the form displays a
clear coming-soon message.

Black has a separate branded application preview at `/apply/`, built as a second
Vite HTML entry so direct links and reloads work on GitHub Pages. All five Black
CTAs open it. Draft questions cover name, email, current English, goals, obstacles,
daily availability, and acknowledgment that Black is paid and admission is selective.
Submission is disabled, and the preview never sends or stores answers. The application
FAQ reflects review before payment; its copy exception is recorded alongside the
offer changes in `reference/free-system-copy-changes.json`.

The status-page visual preview is available at `/status/`. By default it shows
that no application is loaded. The application preview links to
`/status/?preview=received`; a clearly labeled selector demonstrates received,
under review, approved, not accepted, enrollment confirmed, expired link, and
unavailable states. The approval checkout button is disabled. Preview parameters
never represent actual decisions, applicants, payments, or authenticated access.

The branded checkout preview is available at `/checkout/`, linked separately from
the approved status example as “Preview the checkout page.” Its order summary uses
the existing Black offer and an illustrative US$350 one-time founding beta cohort
price, supplied by the user as an example. USD is assumed for the preview; final
pricing, currency, and tax treatment must be confirmed before launch.
Payment fields are noninteractive visual placeholders, not inputs. The pay button
is disabled, no Paddle SDK is loaded, and URL parameters cannot activate checkout.
The responsive page works without JavaScript. Paddle will supply the actual payment
form after its account, product, terms, and private approval flow are configured.

Application, status, and checkout headers have a centered clickable monogram
that returns to the homepage top. The Back to Academy text is removed.
They omit the full footer while retaining contextual links within their content.
The homepage keeps its full footer and contextual floating actions.
The status-page content and header share a 1152px maximum width;
descriptive text has a narrower reading width within the status card. Status and checkout introductions are centered at all widths. The application
introduction and entire Next Steps section are centered on phones; the form remains left-aligned. The checkout
summary monogram is 32px, at the upper-right with its vertical center aligned to
the center of “Your enrollment.” Every mobile status badge occupies a dedicated
row below “Application · Black.” Progress milestones align left in each desktop
column, with connectors between the dots. On mobile, the equally sized groups
are centered within each column; the dot and both text lines remain left-aligned
inside each group.

All four pages use a white vector monogram inside a rounded black square as the
tab favicon. `scripts/build_favicon.mjs` frames the original white SVG path without
modifying it and creates a 16/32/48/64px ICO fallback for older browsers. The original
master files and the logos displayed within the website are unchanged.

Application processing, real-time private status updates, approval emails, and
an embedded provider checkout are not connected. See
`reference/black-application-integration.md` for the remaining integration work.

Before enabling submission, connect the user's actual public Brevo signup form (or their
chosen provider), configure the system-delivery automation and resource link,
and verify a real signup through inbox delivery. Use the provider's documented
confirmation/error responses; do not assume that a successful HTTP request means
an email was sent. API keys must never be included in this static repository.

Node 24 was used for validation. From this directory:

```sh
npm ci --no-audit --no-fund
npm run dev
```

Build with `npm run build`. The generated `dist/` directory can be served by any
static host. `npm run preview` serves the production build for local inspection.
Fonts and supplied SVG branding are bundled locally.
The HTML preloads the Latin Playfair regular/italic and Inter font files used in
the hero, allowing downloads to begin before CSS is parsed. Vite fingerprints
these URLs and shares the same files with the font-face declarations. The page
remains visible during loading; no JavaScript font gate or artificial delay is used.

## GitHub Pages preview

The source is intended for the `main` branch of
`bearglobal-rgb/personalprojects`; the static production build is deployed on
the separate `gh-pages` branch. The build uses relative asset paths so it works
under the repository's `/personalprojects/` URL.

Enable the preview at
https://github.com/bearglobal-rgb/personalprojects/settings/pages:

1. Under **Build and deployment**, choose **Deploy from a branch**.
2. Select **gh-pages** and **/ (root)**, then click **Save**.
3. Wait for the Pages deployment to finish, then use the **Visit site** link
   shown by GitHub. Publication is not confirmed until that deployment succeeds.

GitHub Pages serves the compiled site independently of the Codex environment.
Most photograph URLs still point to the original site; the Origin immersion
photograph and its screen replacement are bundled locally. Browser image loading
and the remaining fidelity checks below must be verified on the published page.

## Validation

```sh
npm run build
npm test
```

The Playwright suite uses `/usr/bin/chromium`. Set `CHROMIUM_PATH` if your browser
is installed elsewhere. Checks cover source-text parity, original corner treatments,
responsive width, the Origin line and System highlighting in both scroll directions, protocol/phase
selection, FAQs, navigation, application links and preview behavior, local SVGs, and font loading.

## Outstanding source verification

- GitHub Pages is the selected preview host. The GitHub settings API was blocked
  in this environment, so Pages activation must be completed in the repository
  settings if it is not already enabled.
- The environment proxy blocks `swanacademy.whop.site` with HTTP 403. All five
  original photograph URLs remain in the markup, but their loading could not be
  validated in this environment. No substitute photographs were used.
- The HTML exports omit the header, footer, and system introduction/sidebar.
  Those areas are provisional reconstructions from the screenshot. Sidebar
  supporting text reuses supplied copy, and must be compared against the live
  source before describing this as an identical copy.
- Panel and divider colors and interaction timing are reconstructed from the
  reference. Pixel-for-pixel comparison with the full live page remains pending.

The environment configuration draft includes `swanacademy.whop.site` as a custom
allowed domain. Review and save the environment settings, then publish the
environment. Once source access works, run:

```sh
python scripts/fetch_original_assets.py
npm run build
```

The helper keeps TLS verification enabled, validates image signatures, preserves
conflicting local files, and changes image references only after downloading the
complete original set. Inspect the live page to verify the three reconstructed
areas and the scroll timing, then repeat browser and image-readiness checks.

## Source provenance

`reference/original.html` is the supplied HTML, retained for content-parity tests.
The four `Swan-Academy-*-Master.svg` assets are the supplied originals. Photographs
retain the supplied Swan Academy URLs until downloaded. Inter and Playfair
Display are installed from Fontsource with their original font licenses.

The Origin immersion photograph is preserved byte-for-byte in
`public/assets/origin-immersion-original.jpg`. The generated
`origin-immersion-screen.png` uses the supplied woman-in-red-cardigan still.
The approved perspective transform and final mask are saved in
`reference/immersion-screen.json`, including the final 0.1-pixel downward
expansion of the bottom edge. Run `node scripts/render_immersion_photo.mjs`
to export `origin-immersion-composite.png` at the original 1200×896 resolution
as a lossless PNG. This is a deterministic browser render of the existing
assets, not a new generated scene.

The website displays that PNG as a single responsive image with the same
crop and rounded corners as the neighboring Origin photos: 4:5 on desktop,
and a compact 4:3 frame below 1024 pixels wide.
The former SVG/foreignObject overlay is deliberately absent from the page:
its fixed-size transformed image was removed after the reported overflow and
covered text in iPhone Safari. The decorative offer collage still uses the original remote photo.
Tests compare native photo pixels outside the screen, check the laptop frame,
and verify that the full heading and both paragraphs remain unobscured at
320, 390, 430, 768, and 1024 pixels wide.

Below the desktop breakpoint, the Origin section uses a left-side scroll-driven
line and chapter markers. Photos alternate left and right at 88% of the available
content width (up to 320 pixels), with consistently aligned text and tighter
chapter spacing. Desktop retains its original central line and alternating
two-column layout, with matching chapter circles on the central line. On both
layouts, the circles fill as their chapter reaches the middle of the viewport
and empty again when scrolling back. Responsive tests cover the compact layout from 320 to 1023
pixels and verify forward and reverse timeline progression.

The Rooms section keeps its original desktop grid. Below 1024 pixels, its five
cards form a native horizontal scroll-snap carousel with a preview of the next
card. Readers can swipe, use the arrow/dot buttons, or focus the carousel and
use Left/Right, Home, and End. It does not advance automatically. Reduced-motion
preferences disable animated navigation, and the mobile controls disappear when
the desktop grid returns.
