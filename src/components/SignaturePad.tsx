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

interface SignaturePadProps {
  onSave: (svgPath: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
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

  return (
    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full">
      <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <View className="flex-row items-center">
          <View className="bg-blue-500/20 p-2 rounded-xl mr-2">
            <PenTool size={16} color="#60A5FA" />
          </View>
          <Text className="text-white font-bold text-base">Draw Signature</Text>
        </View>
        <TouchableOpacity onPress={onCancel} className="p-1">
          <X size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <Text className="text-slate-400 text-xs mb-3">
        Sign smoothly with your finger. Signatures stay securely stored on device.
      </Text>

      {/* Touch Canvas */}
      <View
        {...panResponder.panHandlers}
        className="w-full h-44 bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden relative justify-center"
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
            <Text className="text-slate-600 text-sm font-medium">Sign Here</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-between mt-4 space-x-3">
        <TouchableOpacity
          onPress={handleClear}
          className="bg-slate-800 px-4 py-3 rounded-xl flex-row items-center"
        >
          <RotateCcw size={14} color="#94A3B8" />
          <Text className="text-slate-300 text-xs font-semibold ml-1.5">Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={paths.length === 0 && !currentPath}
          className={`px-5 py-3 rounded-xl flex-row items-center ${
            paths.length > 0 || currentPath ? 'bg-blue-600' : 'bg-slate-800 opacity-50'
          }`}
        >
          <Check size={16} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Save to Vault</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
