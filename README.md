# Swan Academy reconstruction

Static Vite + Tailwind site built from the supplied Swan Academy HTML export,
brand specifications, SVGs, and screenshots. All supplied main-page wording and
checkout destinations are preserved. Original corner treatments are restored:
rounded cards and photographs, smaller rounded inner frames, and circular avatars
and badges. Buttons retain their original rectangular shape. Both timeline structures have
scroll-linked progress; the system's active protocol and phase follow scrolling
in either direction. Includes native FAQ disclosures and mobile navigation.

## Run

Node 24 was used for validation. From this directory:

```sh
npm ci --no-audit --no-fund
npm run dev
```

Build with `npm run build`. The generated `dist/` directory can be served by any
static host. `npm run preview` serves the production build for local inspection.
Fonts and supplied SVG branding are bundled locally.

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
The photograph URLs still point to the original site. Browser image loading
and the remaining fidelity checks below must be verified on the published page.

## Validation

```sh
npm run build
npm test
```

The Playwright suite uses `/usr/bin/chromium`. Set `CHROMIUM_PATH` if your browser
is installed elsewhere. Checks cover source-text parity, original corner treatments,
responsive width, both timelines in both scroll directions, protocol/phase
selection, FAQs, navigation, checkout URLs, local SVGs, and font loading.

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
