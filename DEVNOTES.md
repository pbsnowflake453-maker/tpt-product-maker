
## Cold Read pictures
- Optional picture per passage: slots in #crPics (Upload with accept=image/*, paste, or drag; Remove). Stored in CR_PICS by passage title, scaled to max 1200px PNG on a white background, passed as cfg.pics {index: icon}.
- coldread.js passagePage draws it contain-fit in a 2.6x1.5in box right of Key Words; passage starts below the taller of the two. No picture means no layout change.
- Test: tests/coldread-pics.js (server on 8812).

## Icon QC
- tools/icon_qc.py flags empty/faint/lowcontrast/thin/tiny. tools/import_icons.py now darkens and thickens thin JPG lines by default (--no-enhance to skip).
- Dropped 61 unclear icons (list in previews/icon-qc/still_bad.json, sources moved to /workspace/icon_dropped). IMAGE_MAP now 563.
- Picture Write hides skills with fewer than 9 pictures (skillsFor filters with T._pwAvail).
