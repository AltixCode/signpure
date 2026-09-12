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
            !isPro ? (
              <TouchableOpacity
                onPress={() => router.push('/paywall')}
                className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full flex-row items-center"
              >
                <Crown size={14} color="#F59E0B" />
                <Text className="text-amber-400 text-xs font-bold ml-1.5">{t('proBadge')}</Text>
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
          }}
        />
      </Stack>
    </>
  );
}
