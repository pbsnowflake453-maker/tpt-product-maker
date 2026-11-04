# TpT Product Maker (My Side of the Classroom)
Static site, no server or sign-in. Open index.html through any static host.
- js/core.js: shared page model (inches, landscape letter), fonts, logo, Terms of Use, shuffle helpers, and the canvas, PDF (jsPDF) and PowerPoint (PptxGenJS) renderers.
- js/products/*.js: one file per product type. Each pushes {id, name, status, display(skill), build(skill, seed, label)} onto TPT.products. Add a new type by adding a file plus a script tag.
- data/skills.js: skill bank generated from wordlists_audited.json (CKLA audit).

## Product types (Oct 30 update)
- rollread.js (Roll and Read), rollsolve.js (Roll and Solve), taskcards.js (Task Cards), bingo.js (Bingo, portrait), mystery.js (Mystery Picture, portrait).
- Each module exposes section(cfg, seed), directions(cfgs), cover(sections). core.assemble() builds a single set or a bundle (one cover, one directions page, a divider per set, one Terms of Use).
- js/math.js: math skill menu + problem banks. data/pixels.js: pixel art library (from /workspace/pixel-library/library.json).
- fonts/Fredoka-Bold.ttf is a static instance of Google's Fredoka variable font (wght 700) for the Bingo title.
- coldread.js (Cold Read, portrait): paste passages in a plain-text format (Title:, Key Words:, Passage:, Questions:, --- between passages; *b. marks the right answer, Answer: under a writing question). Auto-wraps, running word counts, bolds key words, cold/hot score lines, answer key if answers are marked.
- picturewrite.js (Picture Write, portrait): 3x3 pictures with writing lines, optional word bank, answer key. Pictures come from data/images.js (window.IMAGE_MAP word -> PNG path). Words mapped to null draw a dashed placeholder box until her real icons are added; set the path to swap one in (core.js loads them at startup and draws them contain-fit in canvas, PDF and PPTX).
- js/listing.js + vendor/jszip.min.js: "TpT listing pack" button on every product. Zip with 01-cover.png (2000x2000, title, skill bubble, two page previews, logo-v2), 02-04 preview PNGs, and listing.txt (title, description, what's included, tags). Uses the current single-set build.
- Importing Picture Write icons (tools/import_icons.py, needs Pillow and cairosvg for SVGs):
  1. Download her finished icon folder from Drive to the box (any subfolders are fine).
  2. Run `python3 tools/import_icons.py <downloaded folder>` (options: `--size 600`, `--bg white|transparent`, `--keep-placeholders`, `--dry-run`).
     Each file name becomes the word (Cat.PNG, cat-1.jpg, "cat (2).svg" -> cat). Images are trimmed, padded, centered on a square, and saved as site/images/icons/<word>.png.
     site/data/images.js (IMAGE_MAP) is rebuilt from the PNGs in site/images/icons/; placeholders are dropped unless --keep-placeholders.
  3. Read the report: Extra = icon words not in any skill's decodable list (never used), Missing = earlier wanted words with no icon, Duplicates, and Skipped files whose names are not words (rename them).
  4. Run tests/all.js and look at the Picture Write pages. Only Picture Write uses IMAGE_MAP today; core.js loads every mapped icon at startup.
- Nov 3 import: 622 icons from Drive "TpT Good Images (word bank)" at 400px, 64-color PNG (about 8.5 MB total). Excluded: numerals (three, five, six, seven, nine, ten, twelve, hundred) and pictures with printed text (dime shows "10", class shows "ABC"). Icons load lazily: Picture Write's needs() lists the 9 words for a page and app.js loads only those (T.loadIcons) before building. picturewrite.js EXTRA adds hand-checked picture words that are decodable for a skill but missing from the audited lists.
