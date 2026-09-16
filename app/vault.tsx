import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Fingerprint,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { usePdfStore, VaultSignature } from '../src/store/usePdfStore';
import { authenticateWithBiometrics } from '../src/services/biometric';
import { SignaturePad } from '../src/components/SignaturePad';
import { PaywallModal } from '../src/components/PaywallModal';
import { useSignatureRasterizer } from '../src/engine/signatureRasterizer';
import { t } from '../src/i18n';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';

export default function VaultScreen() {
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
  const router = useRouter();
  const { vaultSignatures, isPro, addVaultSignature, removeVaultSignature } = usePdfStore();

  const { RasterizerPortal, rasterize } = useSignatureRasterizer();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    const unlock = async () => {
      const authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        setIsUnlocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(t('authFailed'), t('authFailedDesc'));
        router.back();
      }
    };
    unlock();
  }, []);

  const handleAddNewSignature = () => {
    if (!isPro && vaultSignatures.length >= 1) {
      setPaywallVisible(true);
      return;
    }
    setIsDrawing(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    // The drawn path has to become a real PNG here. Storing the SVG string in
    // `base64Png` made every export call embedPng on it, which threw and was
    // swallowed by a catch that only logged — so signatures never reached the
    // exported PDF while the app reported success.
    try {
      const base64Png = await rasterize(svgPath);
      addVaultSignature({
        id: `sig_${Date.now()}`,
        name: `${t('toolSign')} #${vaultSignatures.length + 1}`,
        base64Png,
        createdAt: new Date().toISOString(),
      });
      setIsDrawing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('error'),
        (error as { message?: string })?.message ?? t('signatureSaveFailed'),
      );
    }
  };

  if (!isUnlocked) {
    return (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: theme.background }}>
        <View className="bg-purple-500/20 p-5 rounded-full mb-4">
          <Fingerprint size={48} color={theme.purple} />
        </View>
        <Text className="text-xl font-bold text-center" style={{ color: theme.text }}>{t('unlockingVault')}</Text>
        <Text className="text-xs text-center mt-1" style={{ color: theme.textSecondary }}>
          {t('authenticating')}
        </Text>
      </View>
    );
  }

  return (
    <>
      {RasterizerPortal}
    <View className="flex-1 px-5 py-4" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 , ...tabletColumn}}>
        {/* Top Vault Status */}
        <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
          <View className="flex-row items-center">
            <View className="bg-purple-500/20 p-2 rounded-xl mr-2.5">
              <ShieldCheck size={18} color={theme.purple} />
            </View>
            <View>
              <Text className="font-bold text-base" style={{ color: theme.text }}>{t('encryptedVault')}</Text>
              <Text className="text-xs font-medium" style={{ color: theme.success }}>{t('biometricsActive')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddNewSignature}
            className="bg-blue-600 px-3.5 py-2 rounded-xl flex-row items-center"
          >
            <Plus size={16} color={theme.onPrimary} />
            <Text className="font-bold text-xs ml-1" style={{ color: theme.onPrimary }}>{t('newSignature')}</Text>
          </TouchableOpacity>
        </View>

        {/* Drawing Pad modal if active */}
        {isDrawing && (
          <View className="mb-6">
            <SignaturePad
              onSave={handleSaveSignature}
              onCancel={() => setIsDrawing(false)}
            />
          </View>
        )}

        {/* Free Tier Notice */}
        {!isPro && (
          <View className="border p-4 rounded-2xl mb-4 flex-row items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="flex-1 mr-3">
              <Text className="font-semibold text-xs" style={{ color: theme.textSecondary }}>
                {t('freeTierNotice', { count: vaultSignatures.length })}
              </Text>
              <Text className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
                {t('freeTierDesc')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPaywallVisible(true)}
              className="bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex-row items-center"
            >
              <Lock size={12} color={theme.warning} />
              <Text className="text-xs font-bold ml-1" style={{ color: theme.warning }}>{t('unlock')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Signatures List */}
        <Text className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
          {t('savedSignatures', { count: vaultSignatures.length })}
        </Text>

        {vaultSignatures.length > 0 ? (
          <View className="flex-col gap-3">
            {vaultSignatures.map((sig) => (
              <View
                key={sig.id}
                className="border p-4 rounded-2xl mb-3 flex-row items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
              >
                <View className="flex-1 mr-3">
                  <Text className="font-bold text-sm" style={{ color: theme.text }}>{sig.name}</Text>
                  {/* Show the stored signature, not a stand-in: a placeholder
                      gives the user no way to tell whether what they drew was
                      captured correctly before they put it on a document. */}
                  {/* On a paper-coloured chip, because the stored PNG is the
                      one that goes onto a document: near-black ink with a
                      transparent background. Rendered straight onto the dark
                      card it is invisible, which reads as "my signature did not
                      save". */}
                  <View
                    className="mt-1.5 rounded-lg overflow-hidden items-center justify-center"
                    style={{ width: 160, height: 56, backgroundColor: '#F8FAFC' }}
                  >
                    <Image
                      source={{ uri: `data:image/png;base64,${sig.base64Png}` }}
                      style={{ width: 152, height: 48 }}
                      resizeMode="contain"
                      accessibilityLabel={t('savedSignaturePreview')}
                    />
                  </View>
                  <Text className="text-[10px] mt-1 font-mono" style={{ color: theme.textMuted }}>
                    {t('createdDate', { date: new Date(sig.createdAt).toLocaleDateString() })}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeVaultSignature(sig.id);
                  }}
                  className="p-2.5 rounded-xl" style={{ backgroundColor: theme.controlSurface }}
                >
                  <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="border border-dashed rounded-3xl p-8 items-center justify-center" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <Text className="text-sm font-medium text-center mb-1" style={{ color: theme.textSecondary }}>
              {t('noSavedSignatures')}
            </Text>
            <Text className="text-xs text-center max-w-xs" style={{ color: theme.textMuted }}>
              {t('noSavedSignaturesDesc')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
    </>
  );
}
