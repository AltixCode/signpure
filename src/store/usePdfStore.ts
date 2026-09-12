import { create } from 'zustand';

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
  reset: () => void;
}

export const usePdfStore = create<PdfState>((set) => ({
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
  addVaultSignature: (sig) =>
    set((state) => ({
      vaultSignatures: [sig, ...state.vaultSignatures],
    })),
  removeVaultSignature: (id) =>
    set((state) => ({
      vaultSignatures: state.vaultSignatures.filter((s) => s.id !== id),
    })),
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
  incrementSignedCount: () =>
    set((state) => ({ documentsSignedCount: state.documentsSignedCount + 1 })),
  reset: () =>
    set({
      document: null,
      activePageIndex: 0,
      placedElements: [],
    }),
}));
