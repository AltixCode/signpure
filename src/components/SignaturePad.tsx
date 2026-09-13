import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RotateCcw, Check, X, PenTool } from 'lucide-react-native';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

interface SignaturePadProps {
  onSave: (svgPath: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const theme = useTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    },
    onPanResponderRelease: () => {
      if (currentPath) {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath('');
      }
    },
  });

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
    setCurrentPath('');
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const combined = [...paths, currentPath].filter(Boolean).join(' ');
    if (combined) {
      onSave(combined);
    }
  };

  const enabled = paths.length > 0 || currentPath !== null;

  return (
    <View className="border rounded-3xl p-5 w-full" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
      <View className="flex-row items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: theme.cardBorder }}>
        <View className="flex-row items-center">
          <View className="bg-blue-500/20 p-2 rounded-xl mr-2">
            <PenTool size={16} color={theme.primary} />
          </View>
          <Text className="font-bold text-base" style={{ color: theme.text }}>{t('drawSignature')}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} className="p-1">
          <X size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <Text className="text-xs mb-3" style={{ color: theme.textSecondary }}>
        {t('drawSignatureDesc')}
      </Text>

      {/* Touch Canvas */}
      <View
        {...panResponder.panHandlers}
        className="w-full h-44 border rounded-2xl overflow-hidden relative justify-center" style={{ backgroundColor: theme.background, borderColor: theme.cardBorder }}
      >
        <Svg className="w-full h-full">
          {paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke="#38BDF8"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke="#38BDF8"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
        {paths.length === 0 && !currentPath && (
          <View className="absolute items-center justify-center w-full pointer-events-none">
            <Text className="text-sm font-medium" style={{ color: theme.textMuted }}>{t('signHere')}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-between mt-4 gap-3">
        <TouchableOpacity
          onPress={handleClear}
          className="px-4 py-3 rounded-xl flex-row items-center" style={{ backgroundColor: theme.controlSurface }}
        >
          <RotateCcw size={14} color={theme.textMuted} />
          <Text className="text-xs font-semibold ml-1.5" style={{ color: theme.textSecondary }}>{t('clear')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!enabled}
          className="px-5 py-3 rounded-xl flex-row items-center"
          style={{
            backgroundColor: enabled ? theme.primary : theme.controlSurface,
            opacity: enabled ? 1 : 0.5,
          }}
        >
          <Check size={16} color={enabled ? theme.onPrimary : theme.textMuted} />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: enabled ? theme.onPrimary : theme.textMuted }}
          >
            {t('saveToVault')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
