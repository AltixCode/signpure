import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PdfRenderer, { type RenderedPage } from "../../modules/pdf-renderer";
import { useTheme } from "../theme/useTheme";
import { t } from "../i18n";

/** Raster width in pixels; enough to stay sharp when zoomed on a tablet. */
const RENDER_WIDTH = 1600;

export interface CanvasGeometry {
  /** On-screen size of the rendered page, in points. */
  displayWidth: number;
  displayHeight: number;
  /** Page size in PDF points — the space pdf-lib writes into. */
  pointWidth: number;
  pointHeight: number;
}

interface PdfPageCanvasProps {
  uri: string;
  pageIndex: number;
  onTap: (event: GestureResponderEvent, geometry: CanvasGeometry) => void;
  onGeometry?: (geometry: CanvasGeometry) => void;
  children?: React.ReactNode;
}

/**
 * Displays the actual page of the user's PDF.
 *
 * The editor previously drew a hard-coded mock-up of a generic contract, so the
 * user placed signatures onto a picture of a document that was not theirs, and
 * the coordinates bore no relation to the file being written.
 *
 * Geometry is reported back so taps can be converted into PDF points against
 * the same media box pdf-lib measures.
 */
export const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  uri,
  pageIndex,
  onTap,
  onGeometry,
  children,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState<RenderedPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setError(null);

    PdfRenderer.renderPage(uri, pageIndex, RENDER_WIDTH)
      .then((rendered) => {
        if (!cancelled) setPage(rendered);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err?.message ?? t("pageRenderFailed"));
      });

    return () => {
      cancelled = true;
    };
  }, [uri, pageIndex]);

  const geometry: CanvasGeometry | null =
    page && frameWidth > 0
      ? {
          displayWidth: frameWidth,
          displayHeight: (frameWidth * page.pointHeight) / page.pointWidth,
          pointWidth: page.pointWidth,
          pointHeight: page.pointHeight,
        }
      : null;

  useEffect(() => {
    if (geometry) onGeometry?.(geometry);
  }, [geometry?.displayWidth, geometry?.displayHeight, onGeometry]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setFrameWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="w-full" onLayout={handleLayout}>
      {error ? (
        <View
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          className="w-full items-center justify-center rounded-xl border p-8"
        >
          <Text
            style={{ color: theme.textSecondary }}
            className="text-center text-xs"
          >
            {error}
          </Text>
        </View>
      ) : !geometry ? (
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            minHeight: 320,
          }}
          className="w-full items-center justify-center rounded-xl border"
        >
          <ActivityIndicator color={theme.primary} />
          <Text style={{ color: theme.textSecondary }} className="mt-3 text-xs">
            {t("renderingPage")}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={t("placeElementHint")}
          onPress={(event) => onTap(event, geometry)}
          style={{
            width: geometry.displayWidth,
            height: geometry.displayHeight,
          }}
          className="overflow-hidden rounded-xl"
        >
          <Image
            source={{ uri: page!.uri }}
            style={{
              width: geometry.displayWidth,
              height: geometry.displayHeight,
            }}
            resizeMode="contain"
            fadeDuration={0}
          />
          {children}
        </TouchableOpacity>
      )}
    </View>
  );
};
