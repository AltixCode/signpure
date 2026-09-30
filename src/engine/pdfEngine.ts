import { PDFDocument } from "pdf-lib";
import * as FileSystem from "expo-file-system/legacy";
import { PlacedElement, PdfDocumentInfo } from "../store/usePdfStore";
import { base64ToUint8Array, drawElementsIntoPdf } from "./pdfWriter";
import { sanitizeExportFileName } from "./fileNaming";

export { drawElementsIntoPdf };

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
  const signed = await drawElementsIntoPdf(
    base64ToUint8Array(base64),
    elements,
  );

  let binary = "";
  for (let i = 0; i < signed.length; i++)
    binary += String.fromCharCode(signed[i]);
  const modifiedBytesBase64 = btoa(binary);

  const baseCache =
    FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  // The fallback branch above points at a "cache/" subdirectory nothing ever
  // creates — `cacheDirectory` is effectively always set on both platforms,
  // so that branch is rarely exercised, but when it is, writing into a
  // directory that was never made throws ENOENT. `intermediates: true` makes
  // this a no-op when the directory (ordinarily) already exists.
  await FileSystem.makeDirectoryAsync(baseCache, { intermediates: true }).catch(
    () => {},
  );

  // The picked file's display name reaches here unsanitized. A name
  // containing "/" (seen from some Android content providers) or one long
  // enough to blow a filesystem's path-component limit turns this
  // concatenation into a write that throws — see fileNaming.ts.
  const safeOutputName = sanitizeExportFileName(outputName);
  const exportPath = `${baseCache}signpure_${Date.now()}_${safeOutputName}`;

  await FileSystem.writeAsStringAsync(exportPath, modifiedBytesBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return exportPath;
};
