import React, { useCallback, useRef, useState } from "react";
import { Platform, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

/** Drawn on a transparent canvas of this size, then scaled at placement time. */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 240;

interface RasterState {
  token: number;
  svgPath: string;
}

/**
 * Turns a drawn signature into a real PNG.
 *
 * The vault previously stored the raw SVG path string in a field named
 * `base64Png` and handed it to `pdfDoc.embedPng`, which threw on every export.
 * The throw was swallowed by a `catch` that only logged, so signatures silently
 * never appeared in the exported PDF while the app reported success.
 *
 * PNG rather than JPEG: the signature must composite over page content, which
 * needs an alpha channel.
 */
export function useSignatureRasterizer() {
  const shotRef = useRef<View>(null);
  const resolveRef = useRef<((base64: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const tokenRef = useRef(0);
  const [state, setState] = useState<RasterState | null>(null);

  const rasterize = useCallback(
    (svgPath: string): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        if (!svgPath.trim()) {
          reject(new Error("The signature is empty."));
          return;
        }
        resolveRef.current = resolve;
        rejectRef.current = reject;
        tokenRef.current += 1;
        setState({ token: tokenRef.current, svgPath });
      }),
    [],
  );

  // SVG has no load event, so capture on the layout pass that follows mount.
  const handleLayout = useCallback(async () => {
    const resolve = resolveRef.current;
    const reject = rejectRef.current;
    if (!state || !resolve || !reject) return;

    resolveRef.current = null;
    rejectRef.current = null;

    try {
      await new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      );
      const base64 = await captureRef(shotRef, {
        format: "png",
        quality: 1,
        result: "base64",
        useRenderInContext: Platform.OS === "ios",
      });
      resolve(base64);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setState(null);
    }
  }, [state]);

  const RasterizerPortal = state ? (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: -100000, left: 0 }}
      collapsable={false}
    >
      <View
        ref={shotRef}
        collapsable={false}
        onLayout={handleLayout}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: "transparent",
        }}
      >
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} key={state.token}>
          <Path
            d={state.svgPath}
            stroke="#0F172A"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  ) : null;

  return {
    RasterizerPortal,
    rasterize,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}
