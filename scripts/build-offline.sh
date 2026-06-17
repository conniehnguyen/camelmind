#!/usr/bin/env bash
# Build a self-contained offline ZIP for one version of the help center.
#
# Usage:
#   ./scripts/build-offline.sh v2.0
#   ./scripts/build-offline.sh v1.9
#
# Output: offline-builds/gw-helpcenter-<version>-offline.zip
# Users unzip and run: npx serve out/   (or open index.html directly)

set -euo pipefail

VERSION=${1:-v2.0}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/out"
BUILDS_DIR="$ROOT/offline-builds"
ZIP_NAME="gw-helpcenter-${VERSION}-offline.zip"

# API routes that require a live server — stash them outside app/ during static export
SERVER_ROUTES=(
  "app/api/raw/route.ts"
  "app/api/download/route.ts"
  "app/api/search/route.ts"
  "app/api/auth"
)

stash_routes() {
  mkdir -p "$ROOT/.offline-stash"
  for r in "${SERVER_ROUTES[@]}"; do
    if [ -e "$ROOT/$r" ]; then
      # Flatten path for stash filename
      stash_name="${r//\//__}"
      mv "$ROOT/$r" "$ROOT/.offline-stash/$stash_name"
    fi
  done
}

restore_routes() {
  for r in "${SERVER_ROUTES[@]}"; do
    stash_name="${r//\//__}"
    if [ -e "$ROOT/.offline-stash/$stash_name" ]; then
      # Recreate parent dir if needed (e.g. app/api/raw/)
      mkdir -p "$ROOT/$(dirname "$r")"
      mv "$ROOT/.offline-stash/$stash_name" "$ROOT/$r"
    fi
  done
  rmdir "$ROOT/.offline-stash" 2>/dev/null || true
}

# Always restore on exit (even on error)
trap restore_routes EXIT

echo "▶ Building offline package for version: $VERSION"

# 1. Pre-build the search index (no API server in static export)
echo "  → Generating search index..."
cd "$ROOT"
npx tsx scripts/build-search-index.ts

# 2. Stash server-only routes so next build doesn't complain
echo "  → Stashing server-only API routes..."
stash_routes

# 3. Static export
echo "  → Running next build (OFFLINE_MODE=true, TARGET_VERSION=$VERSION)..."
OFFLINE_MODE=true TARGET_VERSION="$VERSION" npx next build

# 3. Write a minimal README into the export
cat > "$OUT_DIR/README.txt" <<EOF
Game Warden Help Center — Offline Package ($VERSION)
====================================================

To browse the docs locally, run:

    npx serve .

Then open http://localhost:3000 in your browser.

Alternatively, open index.html directly in your browser (some features
like search may be limited without a local server).

This package was generated for authenticated Game Warden users.
Do not redistribute without authorization.
EOF

# 4. Zip the output
echo "  → Packaging..."
mkdir -p "$BUILDS_DIR"
cd "$OUT_DIR"
zip -r "$BUILDS_DIR/$ZIP_NAME" . --quiet

echo "✓ Done: offline-builds/$ZIP_NAME ($(du -sh "$BUILDS_DIR/$ZIP_NAME" | cut -f1))"
