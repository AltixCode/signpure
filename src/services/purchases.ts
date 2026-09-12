import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const RC_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY || 'appl_OGyPDchOHYNtcZXcrpJSHAYDXsh',
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'goog_MIYXZWKnxFUcBpvHPIqGukLSxUa',
});

let isInitialized = false;

export const initPurchases = async (): Promise<void> => {
  if (isInitialized) return;
  try {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    if (RC_API_KEY && !RC_API_KEY.includes('placeholder')) {
      await Purchases.configure({ apiKey: RC_API_KEY });
      isInitialized = true;
    } else {
      console.log('[Purchases] Operating in local development sandbox mode.');
    }
  } catch (error) {
    console.warn('[Purchases] Initialization warning (offline/sandbox):', error);
  }
};

export const purchaseLifetime = async (): Promise<boolean> => {
  try {
    if (!isInitialized) {
      console.log('[Purchases] Mocking lifetime purchase in sandbox mode.');
      return true;
    }
    const offerings = await Purchases.getOfferings();
    const pkg: PurchasesPackage | undefined =
      offerings.current?.lifetime || offerings.current?.availablePackages?.[0];
    if (!pkg) {
      console.warn('[Purchases] No lifetime package in current offering.');
      return false;
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('[Purchases] Purchase error:', error);
    }
    return false;
  }
};

export const checkIsPro = async (): Promise<boolean> => {
  try {
    if (!isInitialized) {
      return false;
    }
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  } catch {
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  try {
    if (!isInitialized) {
      return true;
    }
    const customerInfo = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  } catch {
    return false;
  }
};
