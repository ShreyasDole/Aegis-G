#!/bin/bash
# ====================================================================
# PRE-DEPLOYMENT CHECKLIST
# ====================================================================
# Run this before deploying to verify codebase is ready
# ====================================================================

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       AEGIS-G PRE-DEPLOYMENT VERIFICATION SCRIPT             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0

# ── 1. Check gunicorn in requirements ──────────────────────────────
echo "✓ Checking requirements.txt..."
if grep -q "gunicorn" app/requirements.txt; then
    echo "  ✓ gunicorn found"
else
    echo "  ✗ gunicorn missing in app/requirements.txt"
    ERRORS=$((ERRORS + 1))
fi

# ── 2. Check Railway config ────────────────────────────────────────
echo "✓ Checking Railway config..."
if [ -f "railway.json" ]; then
    echo "  ✓ railway.json exists"
else
    echo "  ✗ railway.json missing"
    ERRORS=$((ERRORS + 1))
fi

# ── 3. Check Vercel config ─────────────────────────────────────────
echo "✓ Checking Vercel config..."
if [ -f "frontend/vercel.json" ]; then
    echo "  ✓ frontend/vercel.json exists"
else
    echo "  ✗ frontend/vercel.json missing"
    ERRORS=$((ERRORS + 1))
fi

# ── 4. Check Next.js config ────────────────────────────────────────
echo "✓ Checking Next.js config..."
if grep -q "NEXT_PUBLIC_API_URL" frontend/next.config.js; then
    echo "  ✓ NEXT_PUBLIC_API_URL configured"
else
    echo "  ✗ NEXT_PUBLIC_API_URL not found in next.config.js"
    ERRORS=$((ERRORS + 1))
fi

# ── 5. Check frontend build ────────────────────────────────────────
echo "✓ Checking frontend dependencies..."
if [ -f "frontend/package.json" ]; then
    echo "  ✓ package.json exists"
else
    echo "  ✗ package.json missing"
    ERRORS=$((ERRORS + 1))
fi

# ── 6. Check config.py for production validation ───────────────────
echo "✓ Checking production validation..."
if grep -q "validate_production_settings" app/config.py; then
    echo "  ✓ Production validation enabled"
else
    echo "  ✗ Production validation missing"
    ERRORS=$((ERRORS + 1))
fi

# ── 7. Check main.py startup ───────────────────────────────────────
echo "✓ Checking FastAPI startup..."
if grep -q "lifespan" app/main.py; then
    echo "  ✓ Lifespan handler configured"
else
    echo "  ✗ Lifespan handler missing"
    ERRORS=$((ERRORS + 1))
fi

# ── 8. Check git status ────────────────────────────────────────────
echo "✓ Checking git status..."
if [ -d ".git" ]; then
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq 0 ]; then
        echo "  ✓ No uncommitted changes"
    else
        echo "  ⚠ $UNCOMMITTED uncommitted changes (commit before deploying)"
    fi
else
    echo "  ✗ Not a git repository"
    ERRORS=$((ERRORS + 1))
fi

# ── 9. Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "NEXT STEPS:"
    echo "1. git add ."
    echo "2. git commit -m \"feat: deployment configuration\""
    echo "3. git push origin main"
    echo "4. Follow DEPLOYMENT_STEPS.txt"
    echo ""
    exit 0
else
    echo "❌ $ERRORS ERRORS FOUND"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Fix errors above before deploying."
    echo ""
    exit 1
fi
