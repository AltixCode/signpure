import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { PlacedElement } from '../store/usePdfStore';

interface FormFieldOverlayProps {
  element: PlacedElement;
  onRemove: (id: string) => void;
}

export const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({ element, onRemove }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
      className="border border-blue-500/80 bg-blue-500/10 rounded-lg justify-center items-center px-1"
    >
      {element.type === 'signature' ? (
        <Text className="text-blue-400 font-serif italic text-xs">✍️ Signature</Text>
      ) : element.type === 'check' ? (
        <Check size={18} color="#22C55E" />
      ) : (
        <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>
          {element.content}
        </Text>
      )}

      {/* Delete Handle */}
      <TouchableOpacity
        onPress={() => onRemove(element.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="absolute -top-2 -right-2 bg-rose-600 p-0.5 rounded-full"
      >
        <X size={10} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};
