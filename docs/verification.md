# Initial implementation verification

Checked on 27 October 2026. This record describes what was actually checked,
including the limits of the supplied preview environment.

## Build and content

- `npm run check`: nine automated tests passed for a root-path build.
- `BASE_PATH=/core/ SITE_URL=https://mbaldwinsmith.github.io/core/ npm run check`:
  the same nine tests passed for GitHub Pages project paths.
- All 24 independent session sources and seven guidance sources compile.
- All 72 original FAQ questions and answers are preserved in the migration.
- Local links, downloads, generated heading IDs and source-register fragments resolve.
- All 24 PDF documents have two A4 pages, titles and `en-GB` language metadata.
- All 48 PDF pages were rendered and visually inspected. Text-bound checks found
  no blocks beyond the page margins. Main learner text uses 12-point type.
- `npm audit --omit=dev --audit-level=high`: zero reported vulnerabilities after
  selecting the patched Markdown parser version recorded in the lockfile.

## Browser checks

The supplied managed preview was tested in Chromium at desktop width and in
real 390px and 320px iframe browsing contexts, which exercise the same CSS media
queries as an equivalent viewport. This is not a claim of physical-device testing.

Verified through the rendered interface:

- Search returned the Trinity session; a non-matching query showed the empty state.
- Course-part filtering returned the appropriate six sessions.
- Session navigation, completion marking, device-local persistence and resume links.
- Larger reading text, light/dark switching and the progress-reset control.
- Mobile menu expansion and Escape-key dismissal.
- No horizontal page overflow at desktop, 390px or 320px, including a long session.
- Skip-to-content keyboard activation focused the `main` landmark.
- A computed-colour check of visible home-page text found no contrast failures
  against the applicable normal/large-text thresholds. This is a targeted check,
  not a full accessibility audit.
- No application console errors were observed for the preview origin.

The desktop screenshot in this folder shows the finished interface. Site CSS
also implements reduced-motion, forced-colour and print rules, but comprehensive
assistive-technology testing, physical-device testing and formal WCAG conformance
evaluation remain future verification work.

## PWA checks and limits

Automated service-worker simulations verified complete-course and PDF precaching,
offline directory URLs, offline fallback, failed-install cleanup, activation,
explicit update messages and request-scope isolation. The build validates manifest
launch paths, installation icons and the separate maskable icon at both base paths.

The managed preview address uses **HTTP on a remote hostname**. It is not a secure
service-worker origin. Therefore **live install, real offline navigation and the
browser update cycle were not verified in that preview**. The interface correctly
reported the limitation. Check these flows on HTTPS after deployment, or on a
trusted localhost development origin, using the release checklist in the README.

No public deployment is asserted by this record. The manual GitHub Pages workflow
and its repository setting are documented for publication.

## Editorial status

This implementation preserves and presents the planning framework and its
session briefs. It does not turn the AI framework review into ecclesiastical
approval or a claim of demonstrated learner outcomes. The site and README state
that full script development, qualified human theological review, rights decisions,
piloting and the applicable ecclesial approval remain separate tasks.
