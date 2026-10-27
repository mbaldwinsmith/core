# Third-party notices

CORE ships no third-party browser JavaScript or external fonts. The static
build uses two production dependencies, both under the MIT licence:

- **markdown-it** 14.3.3 — https://github.com/markdown-it/markdown-it — CommonMark
  parsing, so CORE does not implement an incomplete Markdown parser.
- **pdf-lib** 1.17.1 — https://github.com/Hopding/pdf-lib — PDF serialization and
  font metrics for the generated learner sheets.

Their transitive dependencies and licence files are installed by `npm ci` and
recorded in `package-lock.json`. These libraries run during the build only.

The quotation register records the authors, works, locators, translators,
online editions and contextual limits for Q1–Q15. New Advent's editions may
include later editorial revisions; ancient authorship alone is not evidence
that every modern English rendering is public domain. Vatican text and modern
translations have separate rights. See `CONTENT-LICENSE.md` and the source
register before reusing these extracts.

The included PNG and SVG icons are original geometric artwork. Headings and
body text use the reader's installed system fonts. The PDFs use their viewer's
standard Helvetica and Times fonts, without distributing external font files.
