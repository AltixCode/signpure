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
  viewport: ViewportTransform,
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
  viewport: ViewportTransform,
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

export interface DragBounds {
  pageWidth: number;
  pageHeight: number;
  /** The dragged element's own size, in PDF points, so it cannot be dragged off the page. */
  width: number;
  height: number;
}

/**
 * Applies a screen-space drag delta (as PanResponder's `gestureState.dx/dy`
 * reports it) to an element's stored PDF-space position.
 *
 * Screen x grows right, matching PDF x, so the horizontal delta carries over
 * unchanged. Screen y grows downward while PDF y grows upward — the same
 * inversion `screenToPdfCoordinates` applies — so the vertical delta is
 * subtracted rather than added. The result is clamped to the same "keep the
 * whole box on the page" rule `handleCanvasTap` uses when an element is first
 * placed, so a drag can push an element to an edge but never past it.
 */
export const applyDragDelta = (
  start: Point2D,
  deltaScreen: Point2D,
  scale: number,
  bounds: DragBounds,
): Point2D => {
  const safeScale = scale > 0 ? scale : 1;
  const x = start.x + deltaScreen.x / safeScale;
  const y = start.y - deltaScreen.y / safeScale;

  return {
    x: Math.max(0, Math.min(x, bounds.pageWidth - bounds.width)),
    y: Math.max(0, Math.min(y, bounds.pageHeight - bounds.height)),
  };
};

/** Floor on a placed element's size, in PDF points, so a resize can't shrink it to invisible or untappable. */
export const MIN_ELEMENT_SIZE = 16;

export interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageBounds {
  pageWidth: number;
  pageHeight: number;
}

export interface ResizeResult {
  width: number;
  height: number;
  /** The element's bottom-left `y` moves too: it is derived, not stored independently. */
  y: number;
}

/**
 * Applies a screen-space drag delta from a bottom-right corner handle to an
 * element's PDF-space size.
 *
 * The stored anchor is the element's bottom-left corner (`x`, `y`), which is
 * *not* under the handle — the handle sits at the visual top-left corner's
 * diagonal opposite only when nothing moves, but pdf-lib's bottom-left origin
 * means growing height must lower `y` to keep the top edge (where the user's
 * finger actually is) tracking the drag, rather than leaving y fixed and
 * having the box grow upward out from under the handle. `x` does not move:
 * the left edge is already where the handle's opposite corner anchors it.
 *
 * Clamped to a minimum size and to the page edges, using only values fixed
 * for the duration of one gesture (`start`), so repeated calls during a drag
 * are idempotent for the same total delta rather than compounding rounding.
 */
export const applyResizeDelta = (
  start: ResizeStart,
  deltaScreen: Point2D,
  scale: number,
  bounds: PageBounds,
): ResizeResult => {
  const safeScale = scale > 0 ? scale : 1;
  const topPdf = start.y + start.height;

  const maxWidth = Math.max(MIN_ELEMENT_SIZE, bounds.pageWidth - start.x);
  // The top edge cannot rise past the page top, i.e. y cannot go negative —
  // which bounds height at exactly the PDF-space distance from the page's
  // bottom edge up to where the top edge currently sits.
  const maxHeight = Math.max(MIN_ELEMENT_SIZE, topPdf);

  const width = Math.max(
    MIN_ELEMENT_SIZE,
    Math.min(start.width + deltaScreen.x / safeScale, maxWidth),
  );
  const height = Math.max(
    MIN_ELEMENT_SIZE,
    Math.min(start.height + deltaScreen.y / safeScale, maxHeight),
  );

  return { width, height, y: topPdf - height };
};
