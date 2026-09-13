#!/usr/bin/env bash
# Pulls the PDF SignPure exported out of the simulator and checks that the
# signature is really in it, on the rule.
#
# Usage: .maestro/verify-signed-pdf.sh <simulator-udid|android>
#
# Page rendering is PDFKit on iOS and android.graphics.pdf.PdfRenderer on
# Android, so one platform passing says nothing about the other.
set -euo pipefail
TARGET="${1:?usage: verify-signed-pdf.sh <udid|android>}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "$TARGET" = android ]; then
  ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  "$ADB" root >/dev/null 2>&1 || true
  sleep 2
  # The release APK is not debuggable, so run-as is refused; adb root reads the
  # sandbox directly instead.
  REMOTE="$("$ADB" shell "ls -t /data/data/com.altixcode.signpure/cache/signpure_*.pdf" 2>/dev/null | tr -d '\r' | head -1)"
  [ -n "$REMOTE" ] || { echo "FAIL: no exported PDF in the app cache - the export never ran"; exit 1; }
  SIGNED="$(mktemp -d)/signed.pdf"
  "$ADB" pull "$REMOTE" "$SIGNED" >/dev/null
  echo "exported: $(basename "$REMOTE")"
else
  CONTAINER="$(xcrun simctl get_app_container "$TARGET" com.altixcode.signpure data)"
  # exportSignedPdf writes into the cache directory as signpure_<ts>_signed_<name>.
  SIGNED="$(ls -t "$CONTAINER"/Library/Caches/signpure_*.pdf 2>/dev/null | head -1)"
  [ -n "$SIGNED" ] || { echo "FAIL: no exported PDF in the app cache - the export never ran"; exit 1; }
  echo "exported: $(basename "$SIGNED")"
fi

ORIGINAL="$(mktemp -d)/original.pdf"
( cd "$(dirname "$ORIGINAL")" && swiftc -O "$HERE/fixtures/make-agreement.swift" -o gen && ./gen >/dev/null && mv signpure-fixture.pdf original.pdf )

BIN="$(mktemp -d)/verify"
swiftc -O "$HERE/verify-signed-pdf.swift" -o "$BIN"
"$BIN" "$ORIGINAL" "$SIGNED"
