import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
import { Crown } from 'lucide-react-native';
import { initPurchases, checkIsPro } from '../src/services/purchases';
import { usePdfStore } from '../src/store/usePdfStore';
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
                <Text className="text-amber-400 text-xs font-bold ml-1.5">PRO</Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'SignPure',
            headerTitleAlign: 'left',
          }}
        />
        <Stack.Screen
          name="viewer"
          options={{
            title: 'Document Viewer',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="editor"
          options={{
            title: 'Sign & Fill',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="vault"
          options={{
            title: 'Signature Vault',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            title: 'SignPure Pro',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
