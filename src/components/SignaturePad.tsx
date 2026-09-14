import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { RotateCcw, Check, X, PenTool } from "lucide-react-native";
import { t } from "../i18n";
import { useTheme } from "../theme/useTheme";

interface SignaturePadProps {
  onSave: (svgPath: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
}) => {
  const theme = useTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  /**
   * The stroke being drawn, held in a ref as well as in state.
   *
   * React Native keeps the responder object captured when the gesture began,
   * so its handlers close over that render. Reading `currentPath` from state
   * inside onPanResponderRelease therefore sees the value from *before* the
   * stroke was drawn -- an empty string -- and the finished stroke is silently
   * dropped instead of being committed. The visible result is a pad that can
   * only ever hold one stroke: lift the pen and everything before it vanishes,
   * which for a signature is every signature.
   *
   * The ref is read at release time, so it holds what was actually drawn.
   */
  const strokeRef = useRef("");

  // Created once. Rebuilding it every render is what made the stale closure
  // above easy to miss, and a fresh responder mid-gesture is its own hazard.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Claimed in the capture phase, before the surrounding ScrollView gets a
      // say. Without this the scroller wins any stroke with vertical travel --
      // which is most of a signature -- and the pad receives only whichever
      // stroke happens to come while the list is already at a scroll bound.
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // The pad keeps the gesture once it has it. A signature is drawn in
      // strokes that stop and change direction, and each pause is an
      // opportunity for another responder to take over mid-letter.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        strokeRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrentPath(strokeRef.current);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        strokeRef.current = `${strokeRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrentPath(strokeRef.current);
      },
      onPanResponderRelease: () => {
        const finished = strokeRef.current;
        if (!finished) return;
        setPaths((previous) => [...previous, finished]);
        strokeRef.current = "";
        setCurrentPath("");
      },
    }),
  ).current;

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths([]);
    strokeRef.current = "";
    setCurrentPath("");
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const combined = [...paths, currentPath].filter(Boolean).join(" ");
    if (combined) {
      onSave(combined);
    }
  };

  // `currentPath !== null` was always true -- it is initialised to '' and only
  // ever set to '' -- so Save was enabled over an empty pad and saved nothing.
  const enabled = paths.length > 0 || currentPath.length > 0;

  return (
    <View
      className="border rounded-3xl p-5 w-full"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
    >
      <View
        className="flex-row items-center justify-between mb-3 pb-2 border-b"
        style={{ borderColor: theme.cardBorder }}
      >
        <View className="flex-row items-center">
          <View className="bg-blue-500/20 p-2 rounded-xl mr-2">
            <PenTool size={16} color={theme.primary} />
          </View>
          <Text className="font-bold text-base" style={{ color: theme.text }}>
            {t("drawSignature")}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} className="p-1">
          <X size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <Text className="text-xs mb-3" style={{ color: theme.textSecondary }}>
        {t("drawSignatureDesc")}
      </Text>

      {/* Touch Canvas */}
      <View
        {...panResponder.panHandlers}
        className="w-full h-44 border rounded-2xl overflow-hidden relative justify-center"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.cardBorder,
        }}
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
            <Text
              className="text-sm font-medium"
              style={{ color: theme.textMuted }}
            >
              {t("signHere")}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-between mt-4 gap-3">
        <TouchableOpacity
          onPress={handleClear}
          className="px-4 py-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: theme.controlSurface }}
        >
          <RotateCcw size={14} color={theme.textMuted} />
          <Text
            className="text-xs font-semibold ml-1.5"
            style={{ color: theme.textSecondary }}
          >
            {t("clear")}
          </Text>
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
          <Check
            size={16}
            color={enabled ? theme.onPrimary : theme.textMuted}
          />
          <Text
            className="text-xs font-bold ml-1.5"
            style={{ color: enabled ? theme.onPrimary : theme.textMuted }}
          >
            {t("saveToVault")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
