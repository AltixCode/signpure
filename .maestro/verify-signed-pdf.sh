#!/usr/bin/env bash
# Pulls the PDF SignPure exported out of the simulator and checks that the
# signature is really in it, on the rule.
#
# Usage: .maestro/verify-signed-pdf.sh <simulator-udid>
set -euo pipefail
UDID="${1:?usage: verify-signed-pdf.sh <udid>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
CONTAINER="$(xcrun simctl get_app_container "$UDID" com.altixcode.signpure data)"

# exportSignedPdf writes into the cache directory as signpure_<ts>_signed_<name>.
SIGNED="$(ls -t "$CONTAINER"/Library/Caches/signpure_*.pdf 2>/dev/null | head -1)"
[ -n "$SIGNED" ] || { echo "FAIL: no exported PDF in the app cache - the export never ran"; exit 1; }
echo "exported: $(basename "$SIGNED")"

ORIGINAL="$(mktemp -d)/original.pdf"
( cd "$(dirname "$ORIGINAL")" && swiftc -O "$HERE/fixtures/make-agreement.swift" -o gen && ./gen >/dev/null && mv signpure-fixture.pdf original.pdf )

BIN="$(mktemp -d)/verify"
swiftc -O "$HERE/verify-signed-pdf.swift" -o "$BIN"
"$BIN" "$ORIGINAL" "$SIGNED"
