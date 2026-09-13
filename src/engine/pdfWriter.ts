import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PlacedElement } from '../store/usePdfStore';

/** Decodes base64 without Buffer, which is unavailable in the app runtime. */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/**
 * Draws the placed elements into the PDF and returns the new bytes.
 *
 * Kept free of file-system access so it can be exercised directly. Elements
 * arrive in PDF points with a bottom-left origin, as produced by
 * screenToPdfCoordinates.
 */
export const drawElementsIntoPdf = async (
  pdfBytes: Uint8Array,
  elements: PlacedElement[],
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  for (const elem of elements) {
    if (elem.pageIndex >= pages.length) continue;
    const page = pages[elem.pageIndex];

    // Elements are already stored in PDF points with a bottom-left origin, as
    // produced by screenToPdfCoordinates. They previously held raw screen
    // points and were flipped here, which double-counted the conversion.
    const targetX = elem.x;
    const targetY = elem.y;

    if (elem.type === "signature" && elem.content) {
      // A failure here must reach the user. Swallowing it is what let the
      // previous build report a successful export of a document that had no
      // signature on it.
      const cleanBase64 = elem.content.replace(/^data:image\/\w+;base64,/, "");
      const embeddedImage = await pdfDoc.embedPng(
        base64ToUint8Array(cleanBase64),
      );
      page.drawImage(embeddedImage, {
        x: targetX,
        y: targetY,
        width: elem.width,
        height: elem.height,
      });
    } else if (elem.type === "text" || elem.type === "date") {
      // Size from the placed box so text matches what was shown on screen.
      const size = Math.max(6, elem.height * 0.7);
      page.drawText(elem.content || "", {
        x: targetX,
        y: targetY + (elem.height - size) / 2,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else if (elem.type === "check") {
      const size = Math.max(8, elem.height * 0.8);
      page.drawText("✓", {
        x: targetX,
        y: targetY + (elem.height - size) / 2,
        size,
        font,
        color: rgb(0.1, 0.5, 0.2),
      });
    }
  }

  // Destructive Flattening: Flattens form fields into base content stream
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // Document might not have interactive form fields
  }

  return pdfDoc.save();
};
