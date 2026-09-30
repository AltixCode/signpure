import React, { useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import type { PlacedElement } from "../store/usePdfStore";
import { usePdfStore } from "../store/usePdfStore";
import type { CanvasGeometry } from "./PdfPageCanvas";
import {
  applyDragDelta,
  applyResizeDelta,
  pdfToScreenCoordinates,
} from "../engine/coordinateMath";
import { isLikelyValidDate } from "../engine/dateValidation";
import { t } from "../i18n";

interface FormFieldOverlayProps {
  element: PlacedElement;
  geometry: CanvasGeometry;
  onRemove: (id: string) => void;
}

/**
 * Draws a placed element over the rendered page, and makes it interactive: drag to move,
 * a corner handle to resize, and a tap to re-edit a text or date field's content.
 *
 * Elements are stored in PDF points so the export is authoritative; this converts back into
 * screen space for display. Keeping one direction of truth is what makes the preview match
 * the written file — previously the element carried screen coordinates that were then written
 * into the PDF verbatim.
 */
export const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  element,
  geometry,
  onRemove,
}) => {
  const updatePosition = usePdfStore((s) => s.updatePlacedElementPosition);
  const updateSize = usePdfStore((s) => s.updatePlacedElementSize);
  const updateContent = usePdfStore((s) => s.updatePlacedElementContent);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(element.content);

  const scale = geometry.displayWidth / geometry.pointWidth;

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

  const isSignature = element.type === "signature";
  const isEditableText = element.type === "text" || element.type === "date";
  const bounds = {
    pageWidth: geometry.pointWidth,
    pageHeight: geometry.pointHeight,
  };

  // `PanResponder.create` runs once (it lives in a ref, below) and its handlers close over
  // whatever `element`/`scale`/`bounds` existed at that first render. Every value the handlers
  // need is instead read from this ref, kept current on every render, so a component that
  // updates without remounting (this one — `key={elem.id}` in the parent map, unchanging for
  // the element's whole lifetime) never acts on stale coordinates mid-gesture.
  const live = useRef({ element, scale, bounds });
  live.current = { element, scale, bounds };

  const dragOrigin = useRef({ x: element.x, y: element.y });
  const resizeOrigin = useRef({
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  });

  const dragResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        const { element: current } = live.current;
        dragOrigin.current = { x: current.x, y: current.y };
      },
      onPanResponderMove: (_evt, gesture) => {
        const {
          element: current,
          scale: currentScale,
          bounds: currentBounds,
        } = live.current;
        const next = applyDragDelta(
          dragOrigin.current,
          { x: gesture.dx, y: gesture.dy },
          currentScale,
          { ...currentBounds, width: current.width, height: current.height },
        );
        updatePosition(current.id, next.x, next.y);
      },
      onPanResponderRelease: () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    }),
  ).current;

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const { element: current } = live.current;
        resizeOrigin.current = {
          x: current.x,
          y: current.y,
          width: current.width,
          height: current.height,
        };
      },
      onPanResponderMove: (_evt, gesture) => {
        const {
          element: current,
          scale: currentScale,
          bounds: currentBounds,
        } = live.current;
        const next = applyResizeDelta(
          resizeOrigin.current,
          { x: gesture.dx, y: gesture.dy },
          currentScale,
          currentBounds,
        );
        updateSize(current.id, next.width, next.height, next.y);
      },
      onPanResponderRelease: () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    }),
  ).current;

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove(element.id);
  };

  const openEditor = () => {
    if (!isEditableText) return;
    setDraft(element.content);
    setEditing(true);
  };

  const commitEdit = () => {
    updateContent(element.id, draft);
    setEditing(false);
  };

  const dateInvalid = element.type === "date" && !isLikelyValidDate(draft);

  return (
    <View
      style={{
        position: "absolute",
        left: topLeft.x,
        top: topLeft.y,
        width,
        height,
      }}
      {...dragResponder.panHandlers}
    >
      {editing ? (
        <View
          className="h-full w-full rounded border-2 border-blue-500 bg-white px-1"
          style={{ justifyContent: "center" }}
        >
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            style={{ fontSize: Math.max(9, height * 0.55), color: "#0F172A" }}
            keyboardType={
              element.type === "date" ? "numbers-and-punctuation" : "default"
            }
          />
          {dateInvalid ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: "#EF4444",
              }}
            />
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={isEditableText ? 0.7 : 1}
          onPress={openEditor}
          className="h-full w-full items-center justify-center rounded border border-dashed border-blue-500/70 bg-blue-500/5"
        >
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
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={t("cancel")}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ position: "absolute", right: -10, top: -10 }}
        className="h-6 w-6 items-center justify-center rounded-full bg-rose-500"
      >
        {/* The delete affordance sits on a fixed brand red in both themes, so its
            glyph is white regardless of appearance. */}
        <X size={12} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>

      {/* The resize handle: a small bottom-right grip, its own PanResponder so it never
          fights the body's drag responder for the same touch. */}
      <View
        accessibilityLabel={t("resizeHandle")}
        {...resizeResponder.panHandlers}
        style={{
          position: "absolute",
          right: -8,
          bottom: -8,
          width: 22,
          height: 22,
          borderRadius: 11,
        }}
        className="items-center justify-center bg-blue-600"
      >
        <View className="h-2 w-2 rounded-sm bg-white" />
      </View>
    </View>
  );
};
