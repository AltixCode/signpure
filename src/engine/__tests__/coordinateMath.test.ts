import { screenToPdfCoordinates, pdfToScreenCoordinates } from '../coordinateMath';

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

describe('screenToPdfCoordinates', () => {
  it('maps the canvas origin to the top-left of the page', () => {
    const point = screenToPdfCoordinates(0, 0, viewport);
    expect(point.x).toBeCloseTo(0, 5);
    // PDF space has its origin bottom-left, so screen y=0 is the page height.
    expect(point.y).toBeCloseTo(PAGE_HEIGHT, 5);
  });

  it('maps the centre of the canvas to the centre of the page', () => {
    const canvasHeight = (CANVAS_WIDTH * PAGE_HEIGHT) / PAGE_WIDTH;
    const point = screenToPdfCoordinates(CANVAS_WIDTH / 2, canvasHeight / 2, viewport);
    // The defect this guards against stored raw screen points, which put a
    // centre tap at x=180 on a 595pt page — about 30% across.
    expect(point.x).toBeCloseTo(PAGE_WIDTH / 2, 1);
    expect(point.y).toBeCloseTo(PAGE_HEIGHT / 2, 1);
  });

  it('never returns a negative coordinate', () => {
    const point = screenToPdfCoordinates(-50, 5000, viewport);
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeGreaterThanOrEqual(0);
  });

  it('treats a zero scale as 1 rather than dividing by zero', () => {
    const point = screenToPdfCoordinates(100, 100, { ...viewport, scale: 0 });
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
  });
});

describe('pdfToScreenCoordinates', () => {
  it('round-trips a screen point back to itself', () => {
    const screenX = 123;
    const screenY = 271;
    const pdf = screenToPdfCoordinates(screenX, screenY, viewport);
    const back = pdfToScreenCoordinates(pdf.x, pdf.y, viewport);
    expect(back.x).toBeCloseTo(screenX, 4);
    expect(back.y).toBeCloseTo(screenY, 4);
  });

  it('round-trips the page corners', () => {
    for (const [x, y] of [[0, 0], [PAGE_WIDTH, 0], [0, PAGE_HEIGHT], [PAGE_WIDTH, PAGE_HEIGHT]]) {
      const screen = pdfToScreenCoordinates(x, y, viewport);
      const pdf = screenToPdfCoordinates(screen.x, screen.y, viewport);
      expect(pdf.x).toBeCloseTo(x, 3);
      expect(pdf.y).toBeCloseTo(y, 3);
    }
  });
});
