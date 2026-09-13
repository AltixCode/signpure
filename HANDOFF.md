# AGENT WORK TRACKING & HANDOFF STATE

## Current Status: CORE_VERIFIED_IOS — in-app document pick and Android pass outstanding

## Last Updated: 2026-09-13T16:40:00+03:00

## What was wrong

Three separate failures, each of which alone made the app useless:

1. **The editor never showed the user's document.** `app/editor.tsx` drew a
   hard-coded mock-up of a generic contract — grey placeholder bars under a
   "Simulated contract document lines" comment. The chosen PDF was never
   rendered.
2. **Coordinates were meaningless.** Tap positions were stored as raw screen
   points and written into the PDF as points, so a tap at the centre of the
   canvas landed near 30% across an A4 page. `src/engine/coordinateMath.ts`,
   which does this correctly, was imported by nothing.
3. **Signatures never embedded.** The vault stored the drawn SVG path string in
   a field named `base64Png` and handed it to `pdfDoc.embedPng`, which threw on
   every export. The throw was caught by a handler that only logged, so the app
   reported a successful export of a document with nothing on it.

## What is now true

* `modules/pdf-renderer` rasterises pages with PDFKit on iOS and
  `android.graphics.pdf.PdfRenderer` on Android. Both are built in and work on
  simulator and emulator; pdf-lib writes PDFs but cannot rasterise one.
* Taps convert through `coordinateMath` against the page's media box, the same
  box pdf-lib measures, so the preview and the written file share one source of
  truth.
* Signatures are rasterised to real PNGs with alpha, and the vault shows the
  stored signature rather than a placeholder.
* A failed embed now surfaces instead of being swallowed.

## Verification performed

**Unit tests** — `npx jest`, 10 passing across two suites:
* `coordinateMath.test.ts` — origin mapping, centre mapping (the specific
  defect: a centre tap must not land at 30%), clamping, zero-scale guard, and
  round-trip through all four page corners.
* `pdfWriter.test.ts` — signing the real fixture changes the bytes, the output
  reloads as a one-page A4 PDF, an out-of-range page index is ignored, and an
  empty element list leaves the document loadable.

**End-to-end on device** (iPhone 18 Pro, iOS 27, Release build), via
`.maestro/sign-flow.yaml`: launch, open the vault, draw a signature with three
strokes, save it, and confirm the vault reports one saved signature.

**Independent verification of the written PDF** —
`swift scripts/verify-signature.swift <original> <signed>` renders both
documents, diffs them pixel-wise and reports the changed region in PDF points:

```
changed pixels: 36000
bounding box in PDF points: x 80.0-259.5, y 205.5-255.0
RESULT: PASS - a mark was drawn on the signature line
```

The fixture's signature rule is at y=200 spanning x 60-300, so the mark lands
on the rule. A regression to the old behaviour reports zero changed pixels.

## Outstanding

* **Picking a document through the Files sheet is not yet automated.** The
  simulator's picker opens on an empty Recents and the Browse tab did not
  respond to automation. The signing path itself is covered by the tests above,
  which exercise the same `drawElementsIntoPdf` the app calls.
* Android emulator pass: NOT RUN.
* Store listing, screenshots, icon, keywords: NOT DONE. Copy is written and
  validated in `../scripts/store-metadata.json`.
* IAP `signpure_pro_lifetime` exists, priced $9.99, `MISSING_METADATA` pending
  the App Review paywall screenshot.
