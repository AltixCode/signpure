import * as FileSystem from 'expo-file-system/legacy';

import { EMPTY_VAULT, parseVault, serialiseVault, type VaultState } from './vault';

/**
 * Where the vault lives.
 *
 * A JSON file in the app's document directory, for the same reason the ad
 * pacing counters are: it needs no new native dependency. iOS applies Data
 * Protection to this container, so the file is encrypted at rest on any device
 * with a passcode, and the vault screen is additionally gated behind
 * `expo-local-authentication` before it will render.
 */
const vaultPath = () =>
  `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}signpure-vault.json`;

export async function readVault(): Promise<VaultState> {
  try {
    const info = await FileSystem.getInfoAsync(vaultPath());
    if (!info.exists) return EMPTY_VAULT;
    return parseVault(await FileSystem.readAsStringAsync(vaultPath()));
  } catch {
    return EMPTY_VAULT;
  }
}

export async function writeVault(state: VaultState): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(vaultPath(), serialiseVault(state));
  } catch {
    // A write that fails leaves the previous file in place. The user keeps what
    // they had; they lose only the newest change, and the app stays up.
  }
}
