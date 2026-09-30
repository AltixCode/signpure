import { PDFDocument } from "pdf-lib";
import * as FileSystem from "expo-file-system/legacy";
import { exportSignedPdf } from "../pdfEngine";
import type { PlacedElement } from "../../store/usePdfStore";

// `expo-file-system/legacy` resolves to `test/expo-file-system-legacy.ts` — an
// in-memory stub configured in jest.config.js — so these exercise the real
// export path-building logic against a fake filesystem rather than a mock of
// exportSignedPdf itself.
const testFs = FileSystem as unknown as {
  __files: Map<string, string>;
  __reset: () => void;
  cacheDirectory: string;
};

const makeMinimalPdf = async (): Promise<Uint8Array> => {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return doc.save();
};

const seedSourceDocument = async (uri: string): Promise<void> => {
  const bytes = await makeMinimalPdf();
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  testFs.__files.set(uri, btoa(binary));
};

const noElements: PlacedElement[] = [];

describe("exportSignedPdf", () => {
  beforeEach(() => {
    testFs.__reset();
  });

  it("writes the signed PDF under the cache directory and returns a path to it", async () => {
    const sourceUri = "file:///test/picked.pdf";
    await seedSourceDocument(sourceUri);

    const path = await exportSignedPdf(
      sourceUri,
      noElements,
      "signed_contract.pdf",
    );

    expect(path.startsWith(testFs.cacheDirectory)).toBe(true);
    expect(testFs.__files.has(path)).toBe(true);
  });

  it("sanitizes a display name containing a path separator instead of writing into a nonexistent subdirectory", async () => {
    const sourceUri = "file:///test/picked.pdf";
    await seedSourceDocument(sourceUri);

    // Some Android content providers hand back a display name containing
    // "/". Unsanitized, `${cacheDir}signpure_<ts>_signed_<name>` would try to
    // address a subdirectory nothing ever created.
    const path = await exportSignedPdf(
      sourceUri,
      noElements,
      "signed_a/b/evil.pdf",
    );

    expect(path).not.toContain("a/b/evil");
    // Exactly one "/" — the cache directory's own trailing separator — proves
    // the sanitized name introduced no new path segment.
    const afterCacheDir = path.slice(testFs.cacheDirectory.length);
    expect(afterCacheDir).not.toContain("/");
  });

  it("produces a file that reloads as a valid one-page PDF", async () => {
    const sourceUri = "file:///test/picked.pdf";
    await seedSourceDocument(sourceUri);

    const path = await exportSignedPdf(sourceUri, noElements, "signed.pdf");
    const base64 = testFs.__files.get(path)!;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(1);
  });
});
