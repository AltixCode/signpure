import { requireNativeModule } from 'expo-modules-core';

export interface RenderedPage {
  /** file:// URI of the rasterised page. */
  uri: string;
  /** Raster size in pixels. */
  pixelWidth: number;
  pixelHeight: number;
  /** Page size in PDF points — the coordinate space pdf-lib writes into. */
  pointWidth: number;
  pointHeight: number;
}

export interface PdfInfo {
  pageCount: number;
  pages: { pointWidth: number; pointHeight: number }[];
}

interface PdfRendererModule {
  getInfo(uri: string): Promise<PdfInfo>;
  renderPage(uri: string, pageIndex: number, targetWidth: number): Promise<RenderedPage>;
}

/**
 * Rasterises PDF pages for display.
 *
 * Uses the platform renderers (PDFKit on iOS, android.graphics.pdf.PdfRenderer
 * on Android) rather than a third-party package: both are built in, add no
 * binary weight, and work on the simulator and emulator. pdf-lib cannot do this
 * — it writes PDFs but cannot rasterise one.
 */
export default requireNativeModule<PdfRendererModule>('PdfRenderer');
