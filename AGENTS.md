# AGENTS.md — rules for any AI agent editing TpT Product Maker

**Ask Samantha before publishing changes.** Never deploy, buy, or post on her behalf without her explicit OK. Batch changes: every re-deploy costs effort, so gather edits, test locally, and publish together when she says so. She likes to talk through ideas before anything is built ("still just talking" = don't build yet).

## Owner & brand
- Store: **My Side of the Classroom** (Teachers Pay Teachers). Logo: `site/assets/logo.png` (apple "TEACH ♥ LOVE ♥ INSPIRE").
- Every product: cover, directions/how-to page, product pages, Terms of Use page (store's standard terms text + logo), footer "© My Side of the Classroom".
- **Black and white only**, except the logo and the Mystery Picture color key / colored answer key. **No clipart. No grade levels anywhere.**
- **Name line at the very top** of every student page.
- Skill shown in a rounded **"Skill: …" bubble** (Andika Bold) — top right on boards/sheets. Bundles: "Skills: a • b • c".

## Fonts (Google Fonts only)
- Titles: **Pacifico** (e.g. "Roll and Read", "Answer Key", "How to Play").
- Body and skill bubble: **Andika** (Regular/Bold). Sniglet was rejected as "too bubbly" for the skill bubble.
- Bingo title only: **Fredoka Bold**, big, bubble-letter style.
- Fonts are embedded in the PDF (jsPDF) and referenced by name in the PPTX.

## Output formats
- **PowerPoint is the main download** (editable in Google Slides without signing in); PDF also offered.
- **Google Slides safety:** no theme colors, no table styles (draw grids with shapes/lines, not tables), explicit white fills / white slide background, Google Fonts only. A previous version showed blue shading in Slides because of table styles — never reintroduce them.
- Samantha edits odd words herself in the PPTX; don't add explanations of why words were chosen or "fewer than 36 words" warnings to the documents.

## Reading skills & words (CKLA)
- Words come from `spec/wordlists_audited.json`, audited against the **Amplify CKLA 3rd ed. Skills Scope & Sequence (K, G1, G2)**. Decodable = every pattern used is taught at or before the skill's placement; later-pattern words are **Challenge** words. Keep her words (e.g. our/hour/flour/sour stay).
- Options in the picker: **CKLA Units** (skills placed in that unit), **Through Unit** (cumulative, all regular skills through the end of that unit; Tricky/Dolch/Fry excluded), **Categories** (pooled groups: Short Vowel CVC, FLOSS, blends, digraphs, Magic e, long-vowel spellings, r-controlled incl. "ar, or, er", etc.), and **Single Skills**. A category's pool = union of members' decodable words; placement = latest member; unit placement = end of the unit.
- **Display names:** for K and G1 skills, drop the parenthetical descriptor everywhere (menus, bubbles, covers, dividers, keys). Exception: the oo skills keep it: **oo (look)**, **oo (soon)**. Where dropping would collide, keep the minimum: th (thin)/th (this), -s (/s/)/-s (/z/)/s (/z/ inside a word), -ed (/t/)/(/d/)/(/ed/); blends are "CVCC ending blends", "CCVC beginning blends", "3-letter blends". G2+ names unchanged. Change labels only (`disp` field), never internal ids or word data. Bubble style is "/ou/", "short a", etc.

## Math skills (js/math.js)
Add/subtract/mixed within 5, 10, 20; 10 more/10 less; tens ± tens (40+20); two-digit ± tens (43±20); two-digit ± two-digit no regrouping (43±25); two-digit addition with regrouping within 100 (43+28); addition facts +0..+10; subtraction facts −0..−10; multiplication by factor ×0..×12; mixed single-digit multiplication; division by divisor; doubles; near doubles; making 10; missing addends; ×10 and ×100. Every math product has an **answer key**.

## Product rules
- **Roll and Read** (landscape): 6x6 grid under die faces, 3 boards with different mixes (no difficulty progression). The 3rd board is a **"Challenge!"** board only if there are ≥12 challenge words (challenge is relative to the skill's own syllable baseline: a 2-syllable list's challenge is 3+ syllables); otherwise a regular board. Word List page split Decodable / Challenge and lists **only the words actually used on the boards**. Large pools are sampled randomly.
- **Roll and Solve** (landscape): same board layout with problems; **3 boards, no Challenge board**, an answer key per board (answer bold + underlined). Repeats never in the same row/column.
- **Task Cards** (landscape): **24 cards A–X, 4 per page**, cute double border (dashed "stitched" inner border, tiny hearts in corners), letter circle, **small** skill bubble, **no directions on the cards**, **thick dotted cut lines**. "How to Use" page with **bold way-to-use titles** (scoot, center, pass it on, write the room, quiz-quiz-trade, small group, early finishers, grab and go, self-check, tip). **3 recording sheets**: blanks beside letters in 2 columns; boxes with letters (6x4, boxes touching); bigger boxes across 2 pages (4x3 each, touching). Answer key page. Math only for now.
- **Bingo** (portrait, one board per page so she can print 2 per page): reading or math; she picks number of boards and size 3x3/4x4/5x5. **FREE space only on 5x5** (star + "FREE" regular weight, all caps); **3x3 and 4x4 have no free space**. Default **same words/answers on every board** (1st graders get upset if a called word isn't on their card) — random-from-pool is optional. Reading can mix several skills. Math boards show **answers**; calls are the **problems**. Always a one-page checklist **calling sheet** (she marks it in a sleeve with dry erase); optional **cut-apart calling cards, 12 per page, thick dotted lines**. Title "Bingo" big Fredoka Bold; skill bubble top right.
- **Mystery Picture** (portrait): pick a pixel image (thumbnails by theme). Colors listed **most pixels → fewest**; each color has an editable swatch (recolors all its pixels), editable crayon name, and a skill (reading) or answer number (math). **Pixel editor** paints single squares with undo/reset. Key = **crayon shapes with the color name inside**; label shows **just the skill** (no "words") or just the number ("10 ="). Colored answer key. The puzzle never says what the picture is.
  - **"Don't color the background"** (per picture, ON by default): background gets no crayon/skill; its squares get words/problems that match **none** of the key; directions say to leave unmatched squares uncolored; answer key leaves them white. OFF = old "White" crayon.
  - Background words must be **decodable**: only from regular skills placed **at or before the latest assigned skill/unit/category**, excluding words from assigned lists, words containing assigned spellings, and assigned short vowels. If the pool is empty, show a clear UI warning (never use later words); small pools repeat spread out. Math background = problems whose answers aren't any color's number.
- **Bundles**: one file = one cover listing the skills, one directions page, a **divider page before each set** (titled with the skill), each set, then one Terms of Use.

## Testing checklist
Serve `site/`, run Playwright, download PPTX + PDF for each product type, a bundle, and the pixel editor; render PDFs to PNG and check visually; optionally convert PPTX with LibreOffice; grep the PPTX XML for `schemeClr`/`tableStyleId` (must be absent). Then zip `site/` contents. **Ask Samantha before publishing.**
