import {
  screenToPdfCoordinates,
  pdfToScreenCoordinates,
  applyDragDelta,
  applyResizeDelta,
} from "../coordinateMath";

// A4 rendered into a 360pt-wide canvas — the shape the editor actually uses.
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const CANVAS_WIDTH = 360;

const viewport = {
  scale: CANVAS_WIDTH / PAGE_WIDTH,
  originX: 0,
  originY: 0,
  pageWidth: PAGE_WIDTH,
  pageHeight: PAGE_HEIGHT,
};

describe("screenToPdfCoordinates", () => {
  it("maps the canvas origin to the top-left of the page", () => {
    const point = screenToPdfCoordinates(0, 0, viewport);
    expect(point.x).toBeCloseTo(0, 5);
    // PDF space has its origin bottom-left, so screen y=0 is the page height.
    expect(point.y).toBeCloseTo(PAGE_HEIGHT, 5);
  });

  it("maps the centre of the canvas to the centre of the page", () => {
    const canvasHeight = (CANVAS_WIDTH * PAGE_HEIGHT) / PAGE_WIDTH;
    const point = screenToPdfCoordinates(
      CANVAS_WIDTH / 2,
      canvasHeight / 2,
      viewport,
    );
    // The defect this guards against stored raw screen points, which put a
    // centre tap at x=180 on a 595pt page — about 30% across.
    expect(point.x).toBeCloseTo(PAGE_WIDTH / 2, 1);
    expect(point.y).toBeCloseTo(PAGE_HEIGHT / 2, 1);
  });

  it("never returns a negative coordinate", () => {
    const point = screenToPdfCoordinates(-50, 5000, viewport);
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeGreaterThanOrEqual(0);
  });

  it("treats a zero scale as 1 rather than dividing by zero", () => {
    const point = screenToPdfCoordinates(100, 100, { ...viewport, scale: 0 });
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
  });
});

describe("pdfToScreenCoordinates", () => {
  it("round-trips a screen point back to itself", () => {
    const screenX = 123;
    const screenY = 271;
    const pdf = screenToPdfCoordinates(screenX, screenY, viewport);
    const back = pdfToScreenCoordinates(pdf.x, pdf.y, viewport);
    expect(back.x).toBeCloseTo(screenX, 4);
    expect(back.y).toBeCloseTo(screenY, 4);
  });

  it("round-trips the page corners", () => {
    for (const [x, y] of [
      [0, 0],
      [PAGE_WIDTH, 0],
      [0, PAGE_HEIGHT],
      [PAGE_WIDTH, PAGE_HEIGHT],
    ]) {
      const screen = pdfToScreenCoordinates(x, y, viewport);
      const pdf = screenToPdfCoordinates(screen.x, screen.y, viewport);
      expect(pdf.x).toBeCloseTo(x, 3);
      expect(pdf.y).toBeCloseTo(y, 3);
    }
  });
});

describe("applyDragDelta", () => {
  const bounds = {
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
    width: 100,
    height: 40,
  };
  const scale = viewport.scale;

  it("moves right and down on screen into right and up in PDF space", () => {
    // PDF y grows upward while screen y grows downward, so a downward drag
    // must *decrease* the stored y — this is the exact inversion that a
    // placed element's export position depends on.
    const start = { x: 50, y: 400 };
    const next = applyDragDelta(start, { x: 36, y: 18 }, scale, bounds);
    expect(next.x).toBeGreaterThan(start.x);
    expect(next.y).toBeLessThan(start.y);
  });

  it("converts a whole-canvas-width screen delta into a whole-page-width PDF delta", () => {
    const start = { x: 0, y: 400 };
    const next = applyDragDelta(start, { x: CANVAS_WIDTH, y: 0 }, scale, {
      ...bounds,
      width: 0,
    });
    expect(next.x).toBeCloseTo(PAGE_WIDTH, 1);
  });

  it("clamps to the left/bottom page edge", () => {
    const start = { x: 10, y: 10 };
    const next = applyDragDelta(start, { x: -9999, y: 9999 }, scale, bounds);
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });

  it("clamps to the right/top page edge, leaving room for the element size", () => {
    const start = { x: 10, y: 700 };
    const next = applyDragDelta(start, { x: 9999, y: -9999 }, scale, bounds);
    expect(next.x).toBeCloseTo(PAGE_WIDTH - bounds.width, 5);
    expect(next.y).toBeCloseTo(PAGE_HEIGHT - bounds.height, 5);
  });

  it("treats a zero scale as 1 rather than dividing by zero", () => {
    const next = applyDragDelta({ x: 0, y: 0 }, { x: 10, y: 10 }, 0, bounds);
    expect(Number.isFinite(next.x)).toBe(true);
    expect(Number.isFinite(next.y)).toBe(true);
  });
});

describe("applyResizeDelta", () => {
  const pageBounds = { pageWidth: PAGE_WIDTH, pageHeight: PAGE_HEIGHT };
  const scale = viewport.scale;

  it("grows width and height when the corner handle is dragged right and down", () => {
    const start = { x: 50, y: 400, width: 100, height: 40 };
    const next = applyResizeDelta(start, { x: 36, y: 18 }, scale, pageBounds);
    expect(next.width).toBeGreaterThan(start.width);
    expect(next.height).toBeGreaterThan(start.height);
  });

  it("keeps the top edge fixed in PDF space — y falls as height grows", () => {
    // The stored anchor is the element's bottom-left corner; growing height
    // downward on screen must lower y by exactly the height gained, or the
    // box's top edge (visually anchored under the drag) would jump.
    const start = { x: 50, y: 400, width: 100, height: 40 };
    const next = applyResizeDelta(start, { x: 0, y: 18 }, scale, pageBounds);
    const topBefore = start.y + start.height;
    const topAfter = next.y + next.height;
    expect(topAfter).toBeCloseTo(topBefore, 5);
  });

  it("shrinking never crosses a sane minimum size", () => {
    const start = { x: 50, y: 400, width: 100, height: 40 };
    const next = applyResizeDelta(
      start,
      { x: -9999, y: -9999 },
      scale,
      pageBounds,
    );
    expect(next.width).toBeGreaterThanOrEqual(16);
    expect(next.height).toBeGreaterThanOrEqual(16);
  });

  it("growing never pushes the right edge past the page width", () => {
    const start = { x: 500, y: 400, width: 50, height: 40 };
    const next = applyResizeDelta(start, { x: 9999, y: 0 }, scale, pageBounds);
    expect(start.x + next.width).toBeLessThanOrEqual(PAGE_WIDTH + 0.001);
  });

  it("growing never pushes y negative (top edge past the page top)", () => {
    const start = { x: 50, y: 10, width: 50, height: 20 };
    const next = applyResizeDelta(start, { x: 0, y: 9999 }, scale, pageBounds);
    expect(next.y).toBeGreaterThanOrEqual(-0.001);
  });

  it("treats a zero scale as 1 rather than dividing by zero", () => {
    const start = { x: 0, y: 0, width: 50, height: 20 };
    const next = applyResizeDelta(start, { x: 10, y: 10 }, 0, pageBounds);
    expect(Number.isFinite(next.width)).toBe(true);
    expect(Number.isFinite(next.height)).toBe(true);
    expect(Number.isFinite(next.y)).toBe(true);
  });
});
