#!/usr/bin/env bash
# Build the master PDF for one version of the Help Center.
#
# Usage:
#   ./scripts/build-pdf.sh v2.0
#
# Requires: the offline static export to already be built (run build-offline.sh first)
# Output: offline-builds/Game-Warden-Help-Center-<version>.pdf

set -euo pipefail

VERSION=${1:-v2.0}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATIC_DIR="$ROOT/out"
PAGES_DIR="$ROOT/.pdf-pages"
PORT=8765

cleanup() {
  # Kill local server
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  # Remove intermediate per-page PDFs
  rm -rf "$PAGES_DIR"
}
trap cleanup EXIT

echo "▶ Building master PDF for version: $VERSION"

# 1. Verify the static export exists
if [ ! -d "$STATIC_DIR" ]; then
  echo "✗ Static export not found at $STATIC_DIR"
  echo "  Run ./scripts/build-offline.sh $VERSION first"
  exit 1
fi

# 2. Start a local server for Playwright to hit
echo "  → Starting local server on port $PORT..."
python3 -m http.server "$PORT" --directory "$STATIC_DIR" &>/dev/null &
SERVER_PID=$!
sleep 2

# Verify server is up
if ! curl -s -o /dev/null "http://localhost:$PORT/home/"; then
  echo "✗ Server failed to start"
  exit 1
fi

# 3. Generate per-page PDFs
echo "  → Rendering pages via Playwright..."
cd "$ROOT"
npx tsx scripts/generate-pdfs.ts --port="$PORT" --out="$PAGES_DIR"

# 4. Assemble master PDF
echo "  → Assembling master PDF..."
npx tsx scripts/generate-master-pdf.ts --version="$VERSION" --pages="$PAGES_DIR" --out="$ROOT/offline-builds"

SIZE=$(du -sh "$ROOT/offline-builds/Game-Warden-Help-Center-${VERSION}.pdf" | cut -f1)
echo "✓ Done: offline-builds/Game-Warden-Help-Center-${VERSION}.pdf ($SIZE)"
