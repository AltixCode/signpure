import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as FileSystem from "expo-file-system/legacy";
import { PlacedElement, PdfDocumentInfo } from "../store/usePdfStore";

// Helper to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const parsePdfMetadata = async (
  fileUri: string,
  fileName: string,
): Promise<PdfDocumentInfo> => {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const pdfBytes = base64ToUint8Array(base64);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  const pageInfos = pages.map((p, idx) => {
    const { width, height } = p.getSize();
    return {
      pageIndex: idx,
      width: Math.round(width),
      height: Math.round(height),
    };
  });

  return {
    uri: fileUri,
    name: fileName,
    pageCount: pages.length,
    pages: pageInfos,
  };
};

export const exportSignedPdf = async (
  sourceUri: string,
  elements: PlacedElement[],
  outputName: string,
): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const pdfBytes = base64ToUint8Array(base64);
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

  const modifiedBytesBase64 = await pdfDoc.saveAsBase64({ dataUri: false });

  const baseCache =
    FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  const exportPath = `${baseCache}signpure_${Date.now()}_${outputName}`;

  await FileSystem.writeAsStringAsync(exportPath, modifiedBytesBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return exportPath;
};
