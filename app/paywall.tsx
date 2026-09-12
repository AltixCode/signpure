import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  FileSignature,
  Fingerprint,
  Layers,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { usePdfStore } from '../src/store/usePdfStore';
import { purchaseLifetime, restorePurchases } from '../src/services/purchases';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const { setIsPro } = usePdfStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await purchaseLifetime();
      if (success) {
        setIsPro(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        setErrorMsg(t('purchaseError'));
      }
    } catch {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await restorePurchases();
      if (success) {
        setIsPro(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        setErrorMsg(t('noPriorPurchases'));
      }
    } catch {
      setErrorMsg(t('restoreError'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FileSignature size={20} color="#38BDF8" />,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      icon: <Fingerprint size={20} color="#A855F7" />,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      icon: <Layers size={20} color="#F59E0B" />,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      icon: <ShieldCheck size={20} color="#10B981" />,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ];

  return (
    <View className="flex-1 bg-slate-950 px-6 py-4">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <View className="bg-blue-500/20 p-2 rounded-xl mr-2.5">
            <Sparkles size={20} color="#60A5FA" />
          </View>
          <Text className="text-xl font-extrabold text-white">{t('paywallTitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-slate-900 p-2 rounded-full"
        >
          <X size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Anti-Subscription Card */}
        <View className="bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-900/60 p-5 rounded-2xl mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            {t('antiSubTitle')}
          </Text>
          <Text className="text-base font-bold text-white leading-snug">
            {t('antiSubHeadline')}
          </Text>
          <Text className="text-slate-400 text-xs mt-2 leading-relaxed">
            {t('antiSubDesc')}
          </Text>
        </View>

        {/* Features List */}
        <View className="space-y-4 mb-6">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-start mb-4">
              <View className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 mr-3.5">
                {f.icon}
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold">{f.title}</Text>
                <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {errorMsg && (
          <Text className="text-red-400 text-xs text-center mb-3">{errorMsg}</Text>
        )}
      </ScrollView>

      {/* Bottom CTA Area */}
      <View className="pt-2 pb-6">
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
          className="bg-blue-600 active:bg-blue-500 p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-500/25"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-white font-extrabold text-base mr-2">
                {t('lifetimeAccess')}
              </Text>
              <Check size={18} color="#FFFFFF" strokeWidth={3} />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center space-x-6 mt-4">
          <TouchableOpacity onPress={handleRestore} disabled={loading}>
            <Text className="text-slate-400 text-xs underline">{t('restorePurchases')}</Text>
          </TouchableOpacity>
          <Text className="text-slate-600 text-xs">•</Text>
          <Text className="text-slate-500 text-xs">{t('oneTimePayment')}</Text>
        </View>
      </View>
    </View>
  );
}
