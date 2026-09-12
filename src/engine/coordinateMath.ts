export interface Point2D {
  x: number;
  y: number;
}

export interface ViewportTransform {
  scale: number;
  originX: number;
  originY: number;
  pageWidth: number;
  pageHeight: number;
}

/**
 * Transforms screen touch coordinates into PDF point space (origin bottom-left).
 * Formula:
 * x_pdf = (x_touch - x_origin) / Scale
 * y_pdf = H_page - ((y_touch - y_origin) / Scale)
 */
export const screenToPdfCoordinates = (
  touchX: number,
  touchY: number,
  viewport: ViewportTransform
): Point2D => {
  const { scale, originX, originY, pageHeight } = viewport;
  const safeScale = scale > 0 ? scale : 1;

  const xPdf = (touchX - originX) / safeScale;
  const yPdf = pageHeight - (touchY - originY) / safeScale;

  return {
    x: Math.max(0, xPdf),
    y: Math.max(0, yPdf),
  };
};

/**
 * Transforms PDF coordinates back into screen viewport space (origin top-left).
 */
export const pdfToScreenCoordinates = (
  pdfX: number,
  pdfY: number,
  viewport: ViewportTransform
): Point2D => {
  const { scale, originX, originY, pageHeight } = viewport;
  const safeScale = scale > 0 ? scale : 1;

  const screenX = pdfX * safeScale + originX;
  const screenY = (pageHeight - pdfY) * safeScale + originY;

  return {
    x: screenX,
    y: screenY,
  };
};
