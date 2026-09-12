import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
import { t } from '../src/i18n';

export default function VaultScreen() {
  const router = useRouter();
  const { vaultSignatures, isPro, addVaultSignature, removeVaultSignature } = usePdfStore();

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

  const handleSaveSignature = (svgPath: string) => {
    const newSig: VaultSignature = {
      id: `sig_${Date.now()}`,
      name: `${t('toolSign')} #${vaultSignatures.length + 1}`,
      base64Png: svgPath,
      createdAt: new Date().toISOString(),
    };
    addVaultSignature(newSig);
    setIsDrawing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!isUnlocked) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <View className="bg-purple-500/20 p-5 rounded-full mb-4">
          <Fingerprint size={48} color="#C084FC" />
        </View>
        <Text className="text-xl font-bold text-white text-center">{t('unlockingVault')}</Text>
        <Text className="text-slate-400 text-xs text-center mt-1">
          {t('authenticating')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 px-5 py-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top Vault Status */}
        <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <View className="flex-row items-center">
            <View className="bg-purple-500/20 p-2 rounded-xl mr-2.5">
              <ShieldCheck size={18} color="#C084FC" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">{t('encryptedVault')}</Text>
              <Text className="text-emerald-400 text-xs font-medium">{t('biometricsActive')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddNewSignature}
            className="bg-blue-600 px-3.5 py-2 rounded-xl flex-row items-center"
          >
            <Plus size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs ml-1">{t('newSignature')}</Text>
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
          <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-slate-300 font-semibold text-xs">
                {t('freeTierNotice', { count: vaultSignatures.length })}
              </Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">
                {t('freeTierDesc')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPaywallVisible(true)}
              className="bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex-row items-center"
            >
              <Lock size={12} color="#F59E0B" />
              <Text className="text-amber-400 text-xs font-bold ml-1">{t('unlock')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Signatures List */}
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t('savedSignatures', { count: vaultSignatures.length })}
        </Text>

        {vaultSignatures.length > 0 ? (
          <View className="space-y-3">
            {vaultSignatures.map((sig) => (
              <View
                key={sig.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-3 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-white font-bold text-sm">{sig.name}</Text>
                  <Text className="text-blue-400 font-serif italic text-lg mt-1">{t('verifiedSign')}</Text>
                  <Text className="text-slate-500 text-[10px] mt-1 font-mono">
                    {t('createdDate', { date: new Date(sig.createdAt).toLocaleDateString() })}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeVaultSignature(sig.id);
                  }}
                  className="bg-slate-800 p-2.5 rounded-xl"
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8 items-center justify-center">
            <Text className="text-slate-400 text-sm font-medium text-center mb-1">
              {t('noSavedSignatures')}
            </Text>
            <Text className="text-slate-500 text-xs text-center max-w-xs">
              {t('noSavedSignaturesDesc')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
