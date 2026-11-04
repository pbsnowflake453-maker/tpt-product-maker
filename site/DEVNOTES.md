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
