import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import type { PlacedElement } from "../store/usePdfStore";
import type { CanvasGeometry } from "./PdfPageCanvas";
import { pdfToScreenCoordinates } from "../engine/coordinateMath";
import { t } from "../i18n";

interface FormFieldOverlayProps {
  element: PlacedElement;
  geometry: CanvasGeometry;
  onRemove: (id: string) => void;
}

/**
 * Draws a placed element over the rendered page.
 *
 * Elements are stored in PDF points so the export is authoritative; this
 * converts back into screen space for display. Keeping one direction of truth
 * is what makes the preview match the written file — previously the element
 * carried screen coordinates that were then written into the PDF verbatim.
 */
export const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  element,
  geometry,
  onRemove,
}) => {
  const { scale } = { scale: geometry.displayWidth / geometry.pointWidth };

  // Stored y is the element's bottom edge in PDF space; the overlay needs its
  // top edge in screen space.
  const topLeft = pdfToScreenCoordinates(
    element.x,
    element.y + element.height,
    {
      scale,
      originX: 0,
      originY: 0,
      pageWidth: geometry.pointWidth,
      pageHeight: geometry.pointHeight,
    },
  );

  const width = element.width * scale;
  const height = element.height * scale;

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove(element.id);
  };

  const isSignature = element.type === "signature";

  return (
    <View
      style={{
        position: "absolute",
        left: topLeft.x,
        top: topLeft.y,
        width,
        height,
      }}
    >
      <View className="h-full w-full items-center justify-center rounded border border-dashed border-blue-500/70 bg-blue-500/5">
        {isSignature && element.content?.length > 200 ? (
          <Image
            source={{ uri: `data:image/png;base64,${element.content}` }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        ) : (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: Math.max(9, height * 0.55), color: "#0F172A" }}
            className="px-1 font-semibold"
          >
            {element.content}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={t("cancel")}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ position: "absolute", right: -10, top: -10 }}
        className="h-6 w-6 items-center justify-center rounded-full bg-rose-500"
      >
        <X size={12} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
};
