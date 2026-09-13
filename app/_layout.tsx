import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
import { Crown } from 'lucide-react-native';
import { initPurchases, checkIsPro } from '../src/services/purchases';
import { usePdfStore } from '../src/store/usePdfStore';
import { t } from '../src/i18n';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const { isPro, setIsPro } = usePdfStore();

  useEffect(() => {
    initPurchases();
    checkIsPro().then((pro) => setIsPro(pro));
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#020617' },
          headerRight: () =>
            // No background or border of our own: iOS 26+ already draws a
            // container behind header bar items, and adding one produced a
            // visible double border.
            !isPro ? (
              <TouchableOpacity
                onPress={() => router.push('/paywall')}
                accessibilityRole="button"
                accessibilityLabel={t('paywallTitle')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="flex-row items-center px-1 py-1"
              >
                <Crown size={15} color={'#F59E0B'} />
                <Text
                  style={{ color: '#F59E0B' }}
                  className="ml-1.5 text-xs font-bold"
                >
                  {t('proBadge')}
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('appName'),
            headerTitleAlign: 'left',
          }}
        />
        <Stack.Screen
          name="editor"
          options={{
            title: t('editorTitle'),
            headerBackTitle: t('back'),
          }}
        />
        <Stack.Screen
          name="vault"
          options={{
            title: t('vaultTitle'),
            headerBackTitle: t('back'),
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            title: t('paywallTitle'),
            presentation: 'modal',
            // Inherited from screenOptions otherwise, which let the paywall
            // push another copy of itself without limit.
            headerRight: () => null,
          }}
        />
      </Stack>
    </>
  );
}
