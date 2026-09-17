import type { VaultSignature } from '../store/usePdfStore';

export interface VaultState {
  vaultSignatures: VaultSignature[];
  documentsSignedCount: number;
}

export const EMPTY_VAULT: VaultState = { vaultSignatures: [], documentsSignedCount: 0 };

/**
 * Reads the vault back from disk, defensively.
 *
 * The vault used to keep nothing at all: `usePdfStore` was a plain zustand
 * store with no persistence, so every saved signature lived in memory and died
 * with the process. The screen said "SAVED SIGNATURES (1)" with a creation
 * date, and the free tier advertised "1/1 Saved Signature", while a relaunch
 * emptied it. The signed-document counter behind the free allowance sat in the
 * same store, so the limit reset on every launch and could never close.
 *
 * Everything here tolerates a bad file rather than throwing. This runs on
 * launch, and a vault that cannot be read is a reason to start empty, never a
 * reason to fail to start.
 */
export function parseVault(raw: string): VaultState {
  let blob: unknown;
  try {
    blob = JSON.parse(raw);
  } catch {
    return EMPTY_VAULT;
  }
  if (!blob || typeof blob !== 'object' || Array.isArray(blob)) return EMPTY_VAULT;
  const record = blob as Record<string, unknown>;

  const signatures = Array.isArray(record.vaultSignatures) ? record.vaultSignatures : [];
  const vaultSignatures = signatures.filter((s): s is VaultSignature => {
    if (!s || typeof s !== 'object') return false;
    const sig = s as Record<string, unknown>;
    // `base64Png` is the only field that makes a row usable: it is what gets
    // stamped into the PDF. A row without it renders an empty box and fails
    // silently at export, which is worse than not being there.
    return (
      typeof sig.id === 'string' &&
      typeof sig.name === 'string' &&
      typeof sig.base64Png === 'string' &&
      sig.base64Png.length > 0 &&
      typeof sig.createdAt === 'string'
    );
  });

  const count = record.documentsSignedCount;
  const documentsSignedCount =
    typeof count === 'number' && Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;

  return { vaultSignatures, documentsSignedCount };
}

export function serialiseVault(state: VaultState): string {
  return JSON.stringify({
    vaultSignatures: state.vaultSignatures,
    documentsSignedCount: state.documentsSignedCount,
  });
}
