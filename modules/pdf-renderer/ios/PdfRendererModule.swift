import ExpoModulesCore
import PDFKit
import UIKit

/// Rasterises PDF pages with PDFKit so the editor can show the user the actual
/// document they are signing.
///
/// The previous editor drew a generic mock-up of a contract and placed
/// signatures onto that, so the user never saw their own file and the
/// coordinates bore no relation to it.
public class PdfRendererModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PdfRenderer")

    AsyncFunction("getInfo") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        guard let document = Self.open(uri) else {
          promise.reject("ERR_PDF", "The PDF could not be opened.")
          return
        }

        var pages: [[String: Any]] = []
        for index in 0..<document.pageCount {
          guard let page = document.page(at: index) else { continue }
          let bounds = page.bounds(for: .mediaBox)
          pages.append([
            "pointWidth": bounds.width,
            "pointHeight": bounds.height,
          ])
        }

        promise.resolve(["pageCount": document.pageCount, "pages": pages])
      }
    }

    AsyncFunction("renderPage") {
      (uri: String, pageIndex: Int, targetWidth: Double, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        guard let document = Self.open(uri), let page = document.page(at: pageIndex) else {
          promise.reject("ERR_PDF", "Page \(pageIndex) could not be read.")
          return
        }

        // mediaBox is the same box pdf-lib measures against, so a tap mapped
        // through this ratio lands where the export writes.
        let bounds = page.bounds(for: .mediaBox)
        guard bounds.width > 0, bounds.height > 0 else {
          promise.reject("ERR_PDF", "Page \(pageIndex) has no usable media box.")
          return
        }

        let scale = targetWidth / bounds.width
        let pixelSize = CGSize(
          width: (bounds.width * scale).rounded(),
          height: (bounds.height * scale).rounded()
        )

        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1  // pixelSize is already in pixels.
        format.opaque = true

        let image = UIGraphicsImageRenderer(size: pixelSize, format: format).image { context in
          UIColor.white.set()
          context.fill(CGRect(origin: .zero, size: pixelSize))

          // PDF space has its origin bottom-left; flip into image space.
          context.cgContext.translateBy(x: 0, y: pixelSize.height)
          context.cgContext.scaleBy(x: scale, y: -scale)
          context.cgContext.translateBy(x: -bounds.origin.x, y: -bounds.origin.y)
          page.draw(with: .mediaBox, to: context.cgContext)
        }

        guard let data = image.jpegData(compressionQuality: 0.9) else {
          promise.reject("ERR_PDF", "The rendered page could not be encoded.")
          return
        }

        let destination = FileManager.default.temporaryDirectory
          .appendingPathComponent("signpure_page_\(pageIndex)_\(Int(Date().timeIntervalSince1970 * 1000)).jpg")

        do {
          try data.write(to: destination)
        } catch {
          promise.reject("ERR_PDF", "The rendered page could not be written: \(error.localizedDescription)")
          return
        }

        promise.resolve([
          "uri": destination.absoluteString,
          "pixelWidth": Int(pixelSize.width),
          "pixelHeight": Int(pixelSize.height),
          "pointWidth": bounds.width,
          "pointHeight": bounds.height,
        ])
      }
    }
  }

  private static func open(_ uri: String) -> PDFDocument? {
    let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
    return PDFDocument(url: url)
  }
}
