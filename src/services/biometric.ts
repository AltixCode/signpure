import * as LocalAuthentication from 'expo-local-authentication';

export const checkBiometricsAvailable = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
};

export const authenticateWithBiometrics = async (
  promptMessage: string = 'Unlock Signature Vault'
): Promise<boolean> => {
  try {
    const available = await checkBiometricsAvailable();
    if (!available) return true; // Fallback gracefully if hardware is not present/enrolled

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};
