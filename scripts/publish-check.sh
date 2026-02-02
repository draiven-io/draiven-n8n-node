#!/bin/bash

# Draiven n8n Node - Pre-Publish Check Script
# Run this before publishing to npm

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Draiven n8n Node - Pre-Publish Checklist               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# Check 1: npm login
echo "1. Checking npm authentication..."
if npm whoami &> /dev/null; then
    USERNAME=$(npm whoami)
    print_check 0 "Logged in as: $USERNAME"
else
    print_check 1 "Not logged in to npm"
    echo "   Run: npm login"
fi
echo ""

# Check 2: Dependencies
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
    print_check 0 "node_modules exists"
else
    print_check 1 "node_modules not found"
    echo "   Run: npm install"
fi
echo ""

# Check 3: Build output
echo "3. Checking build output..."
if [ -d "dist" ]; then
    print_check 0 "dist/ directory exists"
    
    if [ -f "dist/credentials/DraivenApi.credentials.js" ]; then
        print_check 0 "Credentials built"
    else
        print_check 1 "Credentials not built"
    fi
    
    if [ -f "dist/nodes/Draiven/Draiven.node.js" ]; then
        print_check 0 "Node built"
    else
        print_check 1 "Node not built"
    fi
    
    if [ -f "dist/nodes/Draiven/draiven.svg" ]; then
        print_check 0 "Icon copied"
    else
        print_check 1 "Icon not copied"
    fi
else
    print_check 1 "dist/ directory not found"
    echo "   Run: npm run build"
fi
echo ""

# Check 4: Package.json validation
echo "4. Validating package.json..."
if [ -f "package.json" ]; then
    print_check 0 "package.json exists"
    
    # Check for required fields
    if grep -q '"n8n-community-node-package"' package.json; then
        print_check 0 "Has n8n-community-node-package keyword"
    else
        print_check 1 "Missing n8n-community-node-package keyword"
    fi
    
    VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')
    echo "   Current version: $VERSION"
else
    print_check 1 "package.json not found"
fi
echo ""

# Check 5: TypeScript compilation
echo "5. Running TypeScript check..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    print_check 1 "TypeScript has errors"
    echo "   Fix TypeScript errors before publishing"
else
    print_check 0 "TypeScript compilation OK"
fi
echo ""

# Check 6: Git status
echo "6. Checking Git status..."
if [ -d ".git" ]; then
    if git diff-index --quiet HEAD --; then
        print_check 0 "No uncommitted changes"
    else
        print_warning "You have uncommitted changes"
        echo "   Consider committing before publishing"
    fi
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "   Current branch: $CURRENT_BRANCH"
else
    print_warning "Not a git repository"
fi
echo ""

# Check 7: README and documentation
echo "7. Checking documentation..."
if [ -f "README.md" ]; then
    print_check 0 "README.md exists"
else
    print_check 1 "README.md not found"
fi

if [ -f "LICENSE" ]; then
    print_check 0 "LICENSE exists"
else
    print_check 1 "LICENSE not found"
fi
echo ""

# Check 8: Test pack
echo "8. Testing package contents..."
echo "   Files that will be published:"
npm pack --dry-run 2>&1 | grep -E "^\s+[0-9]" || echo "   (Could not determine)"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                        SUMMARY                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
fi

echo ""

# Final instructions
if [ $ERRORS -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              READY TO PUBLISH! 🚀                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Run these commands to publish:"
    echo ""
    echo "  npm publish --access public"
    echo ""
    echo "After publishing, verify at:"
    echo "  https://www.npmjs.com/package/n8n-nodes-draiven"
    echo ""
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              FIX ERRORS BEFORE PUBLISHING                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Fix the errors above and run this script again."
    echo ""
    exit 1
fi
