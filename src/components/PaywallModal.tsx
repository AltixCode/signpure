import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  FileSignature,
  Fingerprint,
  Layers,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { usePdfStore } from '../store/usePdfStore';
import { usePaywall } from '../hooks/usePaywall';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../config/legal';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(onClose);

  const features = [
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="border-t rounded-t-3xl p-6 max-h-[90%]" style={{ backgroundColor: theme.background, borderColor: theme.cardBorder }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="bg-blue-500/20 p-2 rounded-xl">
                <Sparkles size={20} color={theme.primary} />
              </View>
              <Text className="text-xl font-extrabold ml-2" style={{ color: theme.text }}>{t('paywallTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-2 rounded-full" style={{ backgroundColor: theme.card }}
            >
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Anti-Subscription Banner */}
          <LinearGradient
            colors={['#172554', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderWidth: 1, borderColor: 'rgba(30,58,138,0.6)', padding: 16, borderRadius: 16, marginBottom: 20 }}
          >
            <Text className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: theme.primary }}>
              {t('antiSubTitle')}
            </Text>
            <Text className="text-sm font-semibold text-slate-100 leading-snug">
              {t('antiSubHeadline')}
            </Text>
          </LinearGradient>

          {/* Features List */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-col gap-3.5 mb-5">
            {features.map((f, i) => (
              <View key={i} className="flex-row items-start mb-3">
                <View className="p-2 rounded-xl border mr-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold" style={{ color: theme.text }}>{f.title}</Text>
                  <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {errorMsg && (
            <Text className="text-xs text-center mb-3" style={{ color: theme.danger }}>{errorMsg}</Text>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-blue-600 active:bg-blue-500 p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-500/20"
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

          {/* Restore & Policy Links */}
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
    </Modal>
  );
};
