import { create } from 'zustand';

import { readVault, writeVault } from '@/services/vaultFile';

export interface VaultSignature {
  id: string;
  name: string;
  base64Png: string;
  createdAt: string;
}

export interface PlacedElement {
  id: string;
  pageIndex: number;
  type: 'signature' | 'date' | 'text' | 'check';
  x: number; // Screen coordinate or PDF coordinate
  y: number;
  width: number;
  height: number;
  content: string; // base64 or text or checkmark
}

export interface PdfPageInfo {
  pageIndex: number;
  width: number;
  height: number;
}

export interface PdfDocumentInfo {
  uri: string;
  name: string;
  pageCount: number;
  pages: PdfPageInfo[];
}

interface PdfState {
  document: PdfDocumentInfo | null;
  activePageIndex: number;
  vaultSignatures: VaultSignature[];
  placedElements: PlacedElement[];
  isPro: boolean;
  documentsSignedCount: number;

  // Actions
  setDocument: (document: PdfDocumentInfo | null) => void;
  setActivePageIndex: (index: number) => void;
  addVaultSignature: (sig: VaultSignature) => void;
  removeVaultSignature: (id: string) => void;
  addPlacedElement: (elem: PlacedElement) => void;
  removePlacedElement: (id: string) => void;
  updatePlacedElementPosition: (id: string, x: number, y: number) => void;
  clearPlacedElements: () => void;
  setIsPro: (isPro: boolean) => void;
  incrementSignedCount: () => void;
  /** Loads the vault from disk. Safe to call more than once. */
  hydrateVault: () => Promise<void>;
  reset: () => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  document: null,
  activePageIndex: 0,
  vaultSignatures: [],
  placedElements: [],
  isPro: false,
  documentsSignedCount: 0,

  setDocument: (document) =>
    set({
      document,
      activePageIndex: 0,
      placedElements: [],
    }),
  setActivePageIndex: (activePageIndex) => set({ activePageIndex }),
  // Every vault mutation writes through to disk.
  //
  // This store kept nothing: a saved signature lived in memory and died with
  // the process, while the screen showed "SAVED SIGNATURES (1)" with a creation
  // date and the free tier advertised "1/1 Saved Signature". The signed-document
  // counter sat here too, so the free allowance reset on every launch and the
  // limit could never close.
  addVaultSignature: (sig) => {
    set((state) => ({ vaultSignatures: [sig, ...state.vaultSignatures] }));
    void persistVault(get);
  },
  removeVaultSignature: (id) => {
    set((state) => ({
      vaultSignatures: state.vaultSignatures.filter((s) => s.id !== id),
    }));
    void persistVault(get);
  },
  addPlacedElement: (elem) =>
    set((state) => ({
      placedElements: [...state.placedElements, elem],
    })),
  removePlacedElement: (id) =>
    set((state) => ({
      placedElements: state.placedElements.filter((e) => e.id !== id),
    })),
  updatePlacedElementPosition: (id, x, y) =>
    set((state) => ({
      placedElements: state.placedElements.map((e) =>
        e.id === id ? { ...e, x, y } : e
      ),
    })),
  clearPlacedElements: () => set({ placedElements: [] }),
  setIsPro: (isPro) => set({ isPro }),
  incrementSignedCount: () => {
    set((state) => ({ documentsSignedCount: state.documentsSignedCount + 1 }));
    void persistVault(get);
  },
  hydrateVault: async () => {
    const { vaultSignatures, documentsSignedCount } = await readVault();
    // Merge rather than replace: a signature drawn before hydration finished
    // would otherwise be thrown away by the load that follows it.
    set((state) => ({
      vaultSignatures: state.vaultSignatures.length ? state.vaultSignatures : vaultSignatures,
      documentsSignedCount: Math.max(state.documentsSignedCount, documentsSignedCount),
    }));
  },
  reset: () =>
    set({
      document: null,
      activePageIndex: 0,
      placedElements: [],
    }),
}));

/** Writes the current vault to disk. Fire and forget; `writeVault` swallows. */
function persistVault(get: () => PdfState): Promise<void> {
  const { vaultSignatures, documentsSignedCount } = get();
  return writeVault({ vaultSignatures, documentsSignedCount });
}
