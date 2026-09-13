package expo.modules.pdfrenderer

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

/**
 * Rasterises PDF pages with the platform renderer so the editor can show the
 * user the actual document they are signing.
 *
 * android.graphics.pdf.PdfRenderer reports page size in points at 72 dpi, which
 * is the same coordinate space pdf-lib writes into, so a tap mapped through the
 * render ratio lands where the export puts it.
 */
class PdfRendererModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PdfRenderer")

    AsyncFunction("getInfo") { uri: String, promise: Promise ->
      try {
        withRenderer(uri) { renderer ->
          val pages = (0 until renderer.pageCount).map { index ->
            renderer.openPage(index).use { page ->
              mapOf(
                "pointWidth" to page.width.toDouble(),
                "pointHeight" to page.height.toDouble(),
              )
            }
          }
          promise.resolve(mapOf("pageCount" to renderer.pageCount, "pages" to pages))
        }
      } catch (error: Exception) {
        promise.reject("ERR_PDF", error.message ?: "The PDF could not be opened.", error)
      }
    }

    AsyncFunction("renderPage") {
      uri: String, pageIndex: Int, targetWidth: Double, promise: Promise ->
      try {
        withRenderer(uri) { renderer ->
          if (pageIndex < 0 || pageIndex >= renderer.pageCount) {
            promise.reject("ERR_PDF", "Page $pageIndex is out of range.", null)
            return@withRenderer
          }

          renderer.openPage(pageIndex).use { page ->
            val scale = targetWidth / page.width
            val pixelWidth = Math.round(page.width * scale).toInt().coerceAtLeast(1)
            val pixelHeight = Math.round(page.height * scale).toInt().coerceAtLeast(1)

            val bitmap = Bitmap.createBitmap(pixelWidth, pixelHeight, Bitmap.Config.ARGB_8888)
            // PdfRenderer composites onto whatever is already there, so an
            // unfilled bitmap leaves transparent gaps where the page is blank.
            bitmap.eraseColor(Color.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

            val destination = File(
              appContext.cacheDirectory,
              "signpure_page_${pageIndex}_${System.currentTimeMillis()}.jpg"
            )
            FileOutputStream(destination).use { out ->
              bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            }
            bitmap.recycle()

            promise.resolve(
              mapOf(
                "uri" to Uri.fromFile(destination).toString(),
                "pixelWidth" to pixelWidth,
                "pixelHeight" to pixelHeight,
                "pointWidth" to page.width.toDouble(),
                "pointHeight" to page.height.toDouble(),
              )
            )
          }
        }
      } catch (error: Exception) {
        promise.reject("ERR_PDF", error.message ?: "The page could not be rendered.", error)
      }
    }
  }

  private inline fun withRenderer(uri: String, block: (PdfRenderer) -> Unit) {
    val context = appContext.reactContext ?: error("No React context available.")
    val parsed = Uri.parse(uri)
    val descriptor: ParcelFileDescriptor = if (parsed.scheme == "content") {
      context.contentResolver.openFileDescriptor(parsed, "r")
        ?: error("The document could not be opened.")
    } else {
      ParcelFileDescriptor.open(
        File(parsed.path ?: uri),
        ParcelFileDescriptor.MODE_READ_ONLY
      )
    }
    descriptor.use { fd -> PdfRenderer(fd).use(block) }
  }
}
