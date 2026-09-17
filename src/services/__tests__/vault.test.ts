import { EMPTY_VAULT, parseVault, serialiseVault, type VaultState } from '../vault';

/**
 * The vault kept nothing.
 *
 * `usePdfStore` was a plain zustand store with no persistence of any kind, so
 * every saved signature lived in memory and died with the process. The screen
 * said "SAVED SIGNATURES (1)" with a creation date, the free tier advertised
 * "1/1 Saved Signature", and none of it survived a relaunch. The signed-document
 * counter behind the free limit was in the same store, so the free allowance
 * silently reset on every launch too -- the gate could never actually close.
 */
describe('vault persistence', () => {
  const sig = {
    id: 'sig_1',
    name: 'Sign #1',
    base64Png: 'iVBORw0KGgo=',
    createdAt: '2026-09-17T12:00:00.000Z',
  };

  it('round-trips signatures and the signed count', () => {
    const state: VaultState = { vaultSignatures: [sig], documentsSignedCount: 2 };
    expect(parseVault(serialiseVault(state))).toEqual(state);
  });

  it('reads an empty vault from anything unusable', () => {
    // A truncated or hand-edited file must not take the app down on launch.
    expect(parseVault('')).toEqual(EMPTY_VAULT);
    expect(parseVault('{')).toEqual(EMPTY_VAULT);
    expect(parseVault('null')).toEqual(EMPTY_VAULT);
    expect(parseVault('[]')).toEqual(EMPTY_VAULT);
  });

  it('drops a signature missing the one field that makes it usable', () => {
    // Without `base64Png` there is nothing to stamp on a PDF, and a row that
    // renders an empty box is worse than a row that is not there.
    const blob = JSON.stringify({
      vaultSignatures: [sig, { id: 'sig_2', name: 'Sign #2', createdAt: sig.createdAt }],
      documentsSignedCount: 0,
    });
    expect(parseVault(blob).vaultSignatures).toEqual([sig]);
  });

  it('never returns a negative or non-numeric signed count', () => {
    expect(parseVault('{"documentsSignedCount":-4}').documentsSignedCount).toBe(0);
    expect(parseVault('{"documentsSignedCount":"7"}').documentsSignedCount).toBe(0);
  });
});
