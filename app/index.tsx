import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  FileText,
  PenTool,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Upload,
  FileCheck,
} from 'lucide-react-native';
import { usePdfStore } from '../src/store/usePdfStore';
import { parsePdfMetadata } from '../src/engine/pdfEngine';
import { PaywallModal } from '../src/components/PaywallModal';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

export default function HomeScreen() {
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
  const router = useRouter();
  const { document, isPro, documentsSignedCount, setDocument } = usePdfStore();
  const [loading, setLoading] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const FREE_MONTHLY_LIMIT = 2;
  const isOverFreeLimit = !isPro && documentsSignedCount >= FREE_MONTHLY_LIMIT;

  const handlePickDocument = async () => {
    if (isOverFreeLimit) {
      setPaywallVisible(true);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const docInfo = await parsePdfMetadata(asset.uri, asset.name || 'document.pdf');
        setDocument(docInfo);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/editor');
      }
    } catch (err: any) {
      Alert.alert(t('importError'), err?.message || t('importErrorDesc'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 , ...tabletColumn}}>
        {/* Header Hero */}
        <View className="mt-4 mb-5">
          <View className="inline-flex self-start bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color={theme.primary} />
            <Text className="text-xs font-semibold ml-1.5" style={{ color: theme.primary }}>
              {t('heroBadge')}
            </Text>
          </View>
          <Text className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            {t('heroTitle')}
          </Text>
          <Text className="text-sm mt-1.5 leading-relaxed" style={{ color: theme.textSecondary }}>
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Current Active Document or Import Card */}
        {document ? (
          <View className="border rounded-3xl p-5 mb-5" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-600/20 p-2.5 rounded-2xl mr-3">
                <FileCheck size={22} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base" style={{ color: theme.text }} numberOfLines={1}>
                  {document.name}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                  {t('pageOf', { current: 1, total: document.pageCount })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/editor')}
              className="bg-blue-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center mt-2 shadow-lg shadow-blue-500/20"
            >
              <Text className="font-bold text-base mr-2" style={{ color: theme.onPrimary }}>{t('editorTitle')}</Text>
              <ForwardArrow size={18} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={loading}
            activeOpacity={0.85}
            className="border-2 border-dashed rounded-3xl p-8 items-center justify-center my-2" style={{ borderColor: theme.cardBorder, backgroundColor: theme.card }}
          >
            {loading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : (
              <>
                <View className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-full mb-4">
                  <Upload size={36} color={theme.primary} />
                </View>
                <Text className="font-bold text-lg text-center mb-1" style={{ color: theme.text }}>
                  {t('selectPdfPrompt')}
                </Text>
                <Text className="text-xs text-center max-w-xs leading-relaxed" style={{ color: theme.textSecondary }}>
                  {t('selectPdfDesc')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Free limit indicator */}
        {!isPro && (
          <View className="border p-3 rounded-2xl mb-4 flex-row items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <Text className="text-xs" style={{ color: theme.textSecondary }}>
              {t('freeLimit', { count: documentsSignedCount, limit: FREE_MONTHLY_LIMIT })}
            </Text>
            <TouchableOpacity onPress={() => setPaywallVisible(true)}>
              <Text className="text-xs font-bold" style={{ color: theme.warning }}>{t('unlock')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Signature Vault Quick Access Card */}
        <TouchableOpacity
          onPress={() => router.push('/vault')}
          activeOpacity={0.8}
          className="border p-4 rounded-2xl mb-4 flex-row items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-purple-500/20 p-2.5 rounded-xl mr-3">
              <Fingerprint size={20} color={theme.purple} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('openVault')}</Text>
              <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                {t('drawSignatureDesc')}
              </Text>
            </View>
          </View>
          <ForwardArrow size={16} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Privacy & Architectural Guarantees */}
        <View className="mt-4 flex-col gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            {t('archGuarantees')}
          </Text>

          <View className="border p-4 rounded-2xl flex-row items-start mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="bg-blue-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('airGapped')}</Text>
              <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>
                {t('airGappedDesc')}
              </Text>
            </View>
          </View>

          <View className="border p-4 rounded-2xl flex-row items-start mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <PenTool size={18} color={theme.success} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('vectorFlattening')}</Text>
              <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>
                {t('vectorFlatteningDesc')}
              </Text>
            </View>
          </View>
        </View>

        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}
