import Foundation
import PDFKit
import AppKit

// Independently re-reads an exported PDF and checks that a signature was
// actually drawn, and drawn in the right place.
//
// The build this replaces stored the signature as an SVG path string in a
// field named base64Png, handed it to embedPng, and swallowed the resulting
// throw in a catch that only logged — so the app reported a successful export
// of a document with nothing on it. Comparing rendered pixels against the
// original is the only check that catches that.
//
// Usage: swift verify-signature.swift <original.pdf> <signed.pdf> [page]

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("Usage: verify-signature.swift <original.pdf> <signed.pdf> [page]")
    exit(2)
}

let pageIndex = args.count > 3 ? Int(args[3]) ?? 0 : 0

func render(_ path: String, page index: Int) -> (NSBitmapImageRep, CGRect)? {
    guard let doc = PDFDocument(url: URL(fileURLWithPath: path)),
          let page = doc.page(at: index) else { return nil }
    let bounds = page.bounds(for: .mediaBox)
    let scale: CGFloat = 2
    let pixelSize = NSSize(width: bounds.width * scale, height: bounds.height * scale)

    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: Int(pixelSize.width), pixelsHigh: Int(pixelSize.height),
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
    ) else { return nil }

    NSGraphicsContext.saveGraphicsState()
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { return nil }
    NSGraphicsContext.current = ctx
    NSColor.white.setFill()
    NSRect(origin: .zero, size: pixelSize).fill()
    ctx.cgContext.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx.cgContext)
    NSGraphicsContext.restoreGraphicsState()

    return (rep, bounds)
}

guard let (before, bounds) = render(args[1], page: pageIndex),
      let (after, _) = render(args[2], page: pageIndex) else {
    print("RESULT: FAIL - could not render one of the documents")
    exit(1)
}

guard before.pixelsWide == after.pixelsWide, before.pixelsHigh == after.pixelsHigh else {
    print("RESULT: FAIL - page size changed between original and export")
    exit(1)
}

// Collect every pixel that differs, in PDF-point space.
var minX = Double.infinity, minY = Double.infinity
var maxX = -Double.infinity, maxY = -Double.infinity
var changed = 0
let scale = Double(before.pixelsWide) / Double(bounds.width)

for py in 0..<before.pixelsHigh {
    for px in 0..<before.pixelsWide {
        guard let a = before.colorAt(x: px, y: py), let b = after.colorAt(x: px, y: py) else { continue }
        let delta = abs(a.redComponent - b.redComponent)
            + abs(a.greenComponent - b.greenComponent)
            + abs(a.blueComponent - b.blueComponent)
        if delta > 0.12 {
            changed += 1
            let x = Double(px) / scale
            // Bitmap rows run top-down; PDF points run bottom-up.
            let y = Double(before.pixelsHigh - py) / scale
            minX = min(minX, x); maxX = max(maxX, x)
            minY = min(minY, y); maxY = max(maxY, y)
        }
    }
}

print("--- difference ---")
print("changed pixels: \(changed)")
if changed == 0 {
    print("RESULT: FAIL - the export is identical to the original; nothing was drawn")
    exit(1)
}
print(String(format: "bounding box in PDF points: x %.1f-%.1f, y %.1f-%.1f", minX, maxX, minY, maxY))

// The fixture's signature rule sits at y=200, spanning x 60-300.
let onRule = minY > 140 && maxY < 320 && minX > 30 && maxX < 340
print("--- placement ---")
print("expected the mark near the signature rule (x 60-300, y ~200)")
print(onRule
      ? "RESULT: PASS - a mark was drawn on the signature line"
      : "RESULT: FAIL - a mark was drawn, but not on the signature line")
exit(onRule ? 0 : 1)
