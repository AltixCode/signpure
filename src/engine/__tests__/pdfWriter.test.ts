import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PDFDocument, rgb } from 'pdf-lib';
import { drawElementsIntoPdf } from '../pdfWriter';
import { screenToPdfCoordinates } from '../coordinateMath';
import type { PlacedElement } from '../../store/usePdfStore';

const FIXTURE = '/tmp/signpure-fixture.pdf';

/** A small opaque PNG standing in for a drawn signature. */
const makeSignaturePng = async (): Promise<string> => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 80]);
  page.drawRectangle({ x: 0, y: 0, width: 200, height: 80, color: rgb(0, 0, 0) });
  // pdf-lib cannot rasterise, so use a hand-built 1x1 PNG scaled at draw time.
  return (
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
    'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  );
};

describe('drawElementsIntoPdf', () => {
  const available = existsSync(FIXTURE);
  const maybe = available ? it : it.skip;

  maybe('writes a signature onto the page and changes the bytes', async () => {
    const source = new Uint8Array(readFileSync(FIXTURE));
    const png = await makeSignaturePng();

    // The fixture's signature rule sits at y=200, spanning x 60-300 in PDF
    // points on an A4 page.
    const element: PlacedElement = {
      id: 'sig',
      pageIndex: 0,
      type: 'signature',
      x: 80,
      y: 205,
      width: 180,
      height: 50,
      content: png,
    };

    const signed = await drawElementsIntoPdf(source, [element]);

    expect(signed.length).toBeGreaterThan(0);
    expect(Buffer.compare(Buffer.from(signed), Buffer.from(source))).not.toBe(0);

    // The output must still be a loadable one-page PDF of the same size.
    const reloaded = await PDFDocument.load(signed);
    expect(reloaded.getPageCount()).toBe(1);
    const { width, height } = reloaded.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);

    writeFileSync('/tmp/signpure-signed.pdf', signed);
  });

  maybe('places a tap from the editor onto the signature rule', async () => {
    // Reproduces what the editor does: a tap near the rule, converted through
    // the same transform, must land inside the rule's band.
    const CANVAS_WIDTH = 360;
    const viewport = {
      scale: CANVAS_WIDTH / 595,
      originX: 0,
      originY: 0,
      pageWidth: 595,
      pageHeight: 842,
    };
    // Screen y for PDF y=200 is (842-200)*scale = 388.4pt down the canvas.
    const point = screenToPdfCoordinates(60, 388.4, viewport);
    expect(point.x).toBeCloseTo(99.2, 0);
    expect(point.y).toBeGreaterThan(180);
    expect(point.y).toBeLessThan(220);
  });

  maybe('leaves the document untouched when there is nothing to place', async () => {
    const source = new Uint8Array(readFileSync(FIXTURE));
    const signed = await drawElementsIntoPdf(source, []);
    const reloaded = await PDFDocument.load(signed);
    expect(reloaded.getPageCount()).toBe(1);
  });

  maybe('ignores an element addressed to a page that does not exist', async () => {
    const source = new Uint8Array(readFileSync(FIXTURE));
    const element: PlacedElement = {
      id: 'oob',
      pageIndex: 99,
      type: 'text',
      x: 10,
      y: 10,
      width: 50,
      height: 20,
      content: 'out of range',
    };
    await expect(drawElementsIntoPdf(source, [element])).resolves.toBeDefined();
  });
});
