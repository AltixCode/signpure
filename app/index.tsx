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
  ArrowRight,
  FileCheck,
} from 'lucide-react-native';
import { usePdfStore } from '../src/store/usePdfStore';
import { parsePdfMetadata } from '../src/engine/pdfEngine';
import { PaywallModal } from '../src/components/PaywallModal';
import { t } from '../src/i18n';

export default function HomeScreen() {
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
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header Hero */}
        <View className="mt-4 mb-5">
          <View className="inline-flex self-start bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color="#60A5FA" />
            <Text className="text-blue-400 text-xs font-semibold ml-1.5">
              {t('heroBadge')}
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">
            {t('heroTitle')}
          </Text>
          <Text className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Current Active Document or Import Card */}
        {document ? (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-600/20 p-2.5 rounded-2xl mr-3">
                <FileCheck size={22} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                  {document.name}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {t('pageOf', { current: 1, total: document.pageCount })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/editor')}
              className="bg-blue-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center mt-2 shadow-lg shadow-blue-500/20"
            >
              <Text className="text-white font-bold text-base mr-2">{t('editorTitle')}</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={loading}
            activeOpacity={0.85}
            className="border-2 border-dashed border-slate-700 bg-slate-900/40 rounded-3xl p-8 items-center justify-center my-2"
          >
            {loading ? (
              <ActivityIndicator color="#60A5FA" size="large" />
            ) : (
              <>
                <View className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-full mb-4">
                  <Upload size={36} color="#60A5FA" />
                </View>
                <Text className="text-white font-bold text-lg text-center mb-1">
                  {t('selectPdfPrompt')}
                </Text>
                <Text className="text-slate-400 text-xs text-center max-w-xs leading-relaxed">
                  {t('selectPdfDesc')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Free limit indicator */}
        {!isPro && (
          <View className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl mb-4 flex-row items-center justify-between">
            <Text className="text-slate-400 text-xs">
              {t('freeLimit', { count: documentsSignedCount, limit: FREE_MONTHLY_LIMIT })}
            </Text>
            <TouchableOpacity onPress={() => setPaywallVisible(true)}>
              <Text className="text-amber-400 text-xs font-bold">{t('unlock')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Signature Vault Quick Access Card */}
        <TouchableOpacity
          onPress={() => router.push('/vault')}
          activeOpacity={0.8}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-purple-500/20 p-2.5 rounded-xl mr-3">
              <Fingerprint size={20} color="#C084FC" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('openVault')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {t('drawSignatureDesc')}
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Privacy & Architectural Guarantees */}
        <View className="mt-4 space-y-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {t('archGuarantees')}
          </Text>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-blue-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('airGapped')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                {t('airGappedDesc')}
              </Text>
            </View>
          </View>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <PenTool size={18} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('vectorFlattening')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                {t('vectorFlatteningDesc')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}
