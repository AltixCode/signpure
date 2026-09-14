import React, { useCallback, useRef, useState } from "react";
import { Platform, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

/** Drawn on a transparent canvas of this size, then scaled at placement time. */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 240;

/** Breathing room around the strokes, as a fraction of the drawing's size. */
const PADDING = 0.08;

/**
 * The box the drawing actually occupies, in its own coordinates.
 *
 * The path arrives in the coordinate space of whatever pad drew it, and that
 * pad is a different size on every device -- roughly 380 points wide on a
 * phone, 960 on a 13" iPad. Painting those coordinates straight onto a fixed
 * 600x240 canvas crops the right-hand end of a signature drawn on a tablet and
 * strands a phone signature in the top-left corner. Framing the drawing by its
 * own extent makes the result independent of the pad it came from.
 */
function boundingBox(path: string) {
  const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length < 2) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    const x = numbers[index];
    const y = numbers[index + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // A single dot has no extent; give it one so the viewBox stays valid.
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const padX = width * PADDING;
  const padY = height * PADDING;
  return {
    x: minX - padX,
    y: minY - padY,
    width: width + padX * 2,
    height: height + padY * 2,
  };
}

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

  const box = state ? boundingBox(state.svgPath) : null;

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
        <Svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          key={state.token}
          viewBox={
            box
              ? `${box.x} ${box.y} ${box.width} ${box.height}`
              : `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`
          }
          preserveAspectRatio="xMidYMid meet"
        >
          <Path
            d={state.svgPath}
            stroke="#0F172A"
            // Scaled with the drawing rather than fixed: the viewBox above can
            // magnify a small signature several times over, and a 3-unit stroke
            // then comes out as a thick smear.
            strokeWidth={box ? Math.max(box.width, box.height) / 120 : 3}
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
