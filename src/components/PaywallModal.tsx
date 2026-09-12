import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
import { usePdfStore } from '../store/usePdfStore';
import { purchaseLifetime, restorePurchases } from '../services/purchases';
import { t } from '../i18n';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
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
        onClose();
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
        onClose();
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-slate-950 border-t border-slate-800 rounded-t-3xl p-6 max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center space-x-2">
              <View className="bg-blue-500/20 p-2 rounded-xl">
                <Sparkles size={20} color="#60A5FA" />
              </View>
              <Text className="text-xl font-extrabold text-white ml-2">{t('paywallTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="bg-slate-900 p-2 rounded-full"
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Anti-Subscription Banner */}
          <View className="bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-900/60 p-4 rounded-2xl mb-5">
            <Text className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              {t('antiSubTitle')}
            </Text>
            <Text className="text-sm font-semibold text-slate-100 leading-snug">
              {t('antiSubHeadline')}
            </Text>
          </View>

          {/* Features List */}
          <ScrollView showsVerticalScrollIndicator={false} className="space-y-3.5 mb-5">
            {features.map((f, i) => (
              <View key={i} className="flex-row items-start mb-3">
                <View className="bg-slate-900 p-2 rounded-xl border border-slate-800 mr-3">
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold">{f.title}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {errorMsg && (
            <Text className="text-red-400 text-xs text-center mb-3">{errorMsg}</Text>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-blue-600 active:bg-blue-500 p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-500/20"
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

          {/* Restore & Policy Links */}
          <View className="flex-row items-center justify-center space-x-6 mt-4">
            <TouchableOpacity onPress={handleRestore} disabled={loading}>
              <Text className="text-slate-400 text-xs underline">{t('restorePurchases')}</Text>
            </TouchableOpacity>
            <Text className="text-slate-600 text-xs">•</Text>
            <Text className="text-slate-500 text-xs">{t('oneTimePayment')}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};
