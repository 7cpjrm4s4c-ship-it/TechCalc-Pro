#!/bin/bash
# ═══════════════════════════════════════════════════════
# deploy.sh — TechCalc Pro Deployment Script
# Setzt automatisch die Build-Version in sw.js
# Verwendung: bash deploy.sh
# ═══════════════════════════════════════════════════════
set -e

# Build-Timestamp: YYYYMMDD-HHMM
TS=$(date +"%Y%m%d-%H%M")

echo "🚀 TechCalc Pro Deploy — Build: $TS"

# Service Worker: Platzhalter durch aktuellen Timestamp ersetzen
sed "s/__BUILD_TS__/$TS/g" sw.js > sw_deploy.js
mv sw_deploy.js sw.js

echo "✓ sw.js versioniert: techcalc-$TS"
echo "✓ Bereit für GitHub Pages Upload"
echo ""
echo "Nächste Schritte:"
echo "  git add -A && git commit -m 'Deploy $TS' && git push"
