import AppKit
import Quartz

// A one-page A4 agreement with a signature rule at a known position, so the
// exported PDF can be checked for a signature landing inside that rule.
let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842)  // A4 in points
let url = URL(fileURLWithPath: "signpure-fixture.pdf")

var mediaBox = pageRect
guard let context = CGContext(url as CFURL, mediaBox: &mediaBox, nil) else {
    fatalError("could not create PDF context")
}

context.beginPDFPage(nil)

let nsContext = NSGraphicsContext(cgContext: context, flipped: false)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = nsContext

NSColor.white.setFill()
pageRect.fill()

func draw(_ text: String, x: CGFloat, y: CGFloat, size: CGFloat, bold: Bool = false) {
    let font = bold ? NSFont.boldSystemFont(ofSize: size) : NSFont.systemFont(ofSize: size)
    text.draw(at: NSPoint(x: x, y: y),
              withAttributes: [.font: font, .foregroundColor: NSColor.black])
}

draw("SERVICE AGREEMENT", x: 60, y: 760, size: 20, bold: true)
draw("Between Northbridge Ltd and the undersigned.", x: 60, y: 720, size: 11)
draw("This agreement is effective on the date of signature.", x: 60, y: 700, size: 11)

// Signature rule: a horizontal line at y=200, from x=60 to x=300.
NSColor.black.setStroke()
let path = NSBezierPath()
path.move(to: NSPoint(x: 60, y: 200))
path.line(to: NSPoint(x: 300, y: 200))
path.lineWidth = 1
path.stroke()
draw("Authorised signature", x: 60, y: 182, size: 9)

draw("Date", x: 360, y: 182, size: 9)
let datePath = NSBezierPath()
datePath.move(to: NSPoint(x: 360, y: 200))
datePath.line(to: NSPoint(x: 500, y: 200))
datePath.lineWidth = 1
datePath.stroke()

NSGraphicsContext.restoreGraphicsState()
context.endPDFPage()
context.closePDF()
print("wrote signpure-fixture.pdf (A4 595x842, signature rule at y=200, x 60-300)")
