#!/bin/bash
# ═══════════════════════════════════════════════════════
# deploy.sh — TechCalc Pro Deployment Script
# Versioniert sw.js automatisch über BUILD_TS
# Verwendung: bash deploy.sh
# ═══════════════════════════════════════════════════════
set -euo pipefail
TS=$(date +"%Y%m%d-%H%M")
echo "🚀 TechCalc Pro Deploy — Build: $TS"
perl -0pi -e "s/const BUILD_TS\s*=\s*'[^']*';/const BUILD_TS   = '$TS';/" sw.js
echo "✓ sw.js versioniert: techcalc-$TS"
echo "✓ Bereit für Upload / GitHub Pages"
echo ""
echo "Nächste Schritte:"
echo "  git add -A && git commit -m 'Deploy $TS' && git push"
