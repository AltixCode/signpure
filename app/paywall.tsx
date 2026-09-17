import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  BadgeCheck,
  FileSignature,
  Fingerprint,
  Layers,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { usePdfStore } from '../src/store/usePdfStore';
import { usePaywall } from '../src/hooks/usePaywall';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../src/config/legal';
import { t } from '../src/i18n';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';

export default function PaywallScreen() {
  const theme = useTheme();
  const tabletColumn = useTabletColumn(640);
  const router = useRouter();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(() => router.back());

  const features = [
    // Ad removal leads the list: it is what the store product is named after, and it is the
    // benefit a free user has been feeling rather than reading about.
    {
      icon: <BadgeCheck size={20} color={theme.primary} />,
      title: t('featAdsTitle'),
      desc: t('featAdsDesc'),
    },
    {
      icon: <FileSignature size={20} color={theme.accent} />,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      icon: <Fingerprint size={20} color={theme.purple} />,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      icon: <Layers size={20} color={theme.warning} />,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      icon: <ShieldCheck size={20} color={theme.success} />,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ];

  return (
    <View className="flex-1 px-6 py-4" style={{ backgroundColor: theme.background }}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <View className="bg-blue-500/20 p-2 rounded-xl mr-2.5">
            <Sparkles size={20} color={theme.primary} />
          </View>
          <Text className="text-xl font-extrabold" style={{ color: theme.text }}>{t('paywallTitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          // An icon-only button with no label reaches VoiceOver as "button" and
          // nothing else, which on the one control that dismisses a paywall is
          // the worst place for it.
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          className="p-2 rounded-full" style={{ backgroundColor: theme.card }}
        >
          <X size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* The scroll area and the pinned CTA are ONE block, centred together.
          Centring the scroll content alone was worse than the problem it
          replaced: on this shape the CTA is pinned OUTSIDE the ScrollView, so
          only the middle moved and a second void opened above the content.
          Measured on a 13" iPad: header 11%, void 25%, content 25%, void 26%,
          CTA 13% -- 51% empty in two slabs, against one 45% slab before.
          Wrapping both and letting the scroll view hug its content keeps the
          button attached to what it is buying. */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ ...tabletColumn }}>
        {/* Anti-Subscription Card */}
        <LinearGradient
            colors={['rgba(23,37,84,0.8)', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderWidth: 1, borderColor: 'rgba(30,58,138,0.6)', padding: 20, borderRadius: 16, marginBottom: 24 }}
          >
          <Text className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: theme.primary }}>
            {t('antiSubTitle')}
          </Text>
          <Text className="text-base font-bold leading-snug" style={{ color: theme.text }}>
            {t('antiSubHeadline')}
          </Text>
          <Text className="text-xs mt-2 leading-relaxed" style={{ color: theme.textSecondary }}>
            {t('antiSubDesc')}
          </Text>
        </LinearGradient>

        {/* Features List */}
        <View className="flex-col gap-4 mb-6">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-start mb-4">
              <View className="p-2.5 rounded-xl border mr-3.5" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                {f.icon}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold" style={{ color: theme.text }}>{f.title}</Text>
                <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {errorMsg && (
          <Text className="text-xs text-center mb-3" style={{ color: theme.danger }}>{errorMsg}</Text>
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
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <>
              <Text className="font-extrabold text-base mr-2" style={{ color: theme.onPrimary }}>
                {ctaLabel}
              </Text>
              <Check size={18} color={theme.onPrimary} strokeWidth={3} />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-6 mt-4">
          <TouchableOpacity onPress={handleRestore} disabled={loading}>
            <Text className="text-xs underline" style={{ color: theme.textSecondary }}>{t('restorePurchases')}</Text>
          </TouchableOpacity>
          <Text className="text-xs" style={{ color: theme.textMuted }}>•</Text>
          <Text className="text-xs" style={{ color: theme.textMuted }}>{t('oneTimePayment')}</Text>
        </View>
        <View className="mt-3 flex-row items-center justify-center gap-5">
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text className="text-xs underline" style={{ color: theme.textMuted }}>
              {t('termsOfUse')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text className="text-xs underline" style={{ color: theme.textMuted }}>
              {t('privacyPolicy')}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
      </View>
    </View>
  );
}
