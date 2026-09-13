import Foundation
import CoreGraphics
import ImageIO
import AppKit

// Confirms a signature was actually burned into the exported PDF, in the right
// place.
//
// Opening the file and finding it parses proves nothing: the build this gate
// replaces produced a valid PDF that simply had no signature in it. So this
// rasterises page 1 of both the original fixture and the export, and compares
// ink coverage inside the signature rule. The rule's position is fixed by the
// fixture generator (x 60-300, y 200 in PDF points, origin bottom-left), so a
// mark landing anywhere else is a coordinate bug, not a signature.
//
// Usage: verify-signed-pdf <original.pdf> <signed.pdf>

let SCALE: CGFloat = 2.0
// Generous around the rule: a signature overshoots its line, and should.
let RULE = CGRect(x: 40, y: 175, width: 290, height: 120)

func inkCoverage(_ path: String, in rect: CGRect) -> (inside: Double, outside: Double)? {
    guard let doc = CGPDFDocument(URL(fileURLWithPath: path) as CFURL),
          let page = doc.page(at: 1) else { return nil }
    let box = page.getBoxRect(.mediaBox)
    let w = Int(box.width * SCALE), h = Int(box.height * SCALE)
    var buf = [UInt8](repeating: 0, count: w * h)
    guard let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8,
                              bytesPerRow: w, space: CGColorSpaceCreateDeviceGray(),
                              bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return nil }
    ctx.setFillColor(CGColor(gray: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: CGFloat(w), height: CGFloat(h)))
    ctx.scaleBy(x: SCALE, y: SCALE)
    ctx.drawPDFPage(page)

    var inside = 0, insideTotal = 0, outside = 0, outsideTotal = 0
    for y in 0..<h {
        for x in 0..<w {
            // The context draws with a bottom-left origin, but its backing
            // buffer starts at the top row, so the row index has to be flipped
            // to get back to PDF user space. Without this the rule rect lands
            // in the page's top margin, which is blank in both files -- the
            // check then reports no ink for a correctly signed PDF.
            let px = CGFloat(x) / SCALE, py = CGFloat(h - 1 - y) / SCALE
            let dark = buf[y * w + x] < 200
            if RULE.contains(CGPoint(x: px, y: py)) {
                insideTotal += 1; if dark { inside += 1 }
            } else {
                outsideTotal += 1; if dark { outside += 1 }
            }
        }
    }
    return (Double(inside) / Double(max(insideTotal, 1)),
            Double(outside) / Double(max(outsideTotal, 1)))
}

let args = CommandLine.arguments
guard args.count == 3,
      let before = inkCoverage(args[1], in: RULE),
      let after = inkCoverage(args[2], in: RULE) else {
    print("RESULT: FAIL - could not rasterise both PDFs"); exit(1)
}

let gained = after.inside - before.inside
print(String(format: "rule area ink:  before %.4f%%  after %.4f%%  (+%.4f%%)",
             before.inside * 100, after.inside * 100, gained * 100))
print(String(format: "rest of page:   before %.4f%%  after %.4f%%",
             before.outside * 100, after.outside * 100))

var ok = true
// A drawn signature covers a clearly measurable share of the rule box. Anything
// at noise level means the export wrote the page through unchanged.
if gained < 0.002 {
    print("FAIL: no new ink inside the signature rule - the export dropped the signature")
    ok = false
}
// And it must land on the rule, not somewhere else on the page.
let elsewhere = after.outside - before.outside
if elsewhere > gained {
    print(String(format: "FAIL: more new ink outside the rule (+%.4f%%) than inside - placement is wrong",
                 elsewhere * 100))
    ok = false
}
print(ok ? "RESULT: PASS - signature is burned into the rule area of the exported PDF" : "RESULT: FAIL")
exit(ok ? 0 : 1)
