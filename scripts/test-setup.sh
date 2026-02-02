#!/bin/bash
# Quick test script for Draiven n8n node
# This verifies the build and setup

echo -e "\033[0;32m🧪 Testing Draiven n8n Node Setup\033[0m"
echo -e "\033[0;32m=================================\033[0m"
echo ""

# Check if build exists
if [ -f "dist/nodes/Draiven/Draiven.node.js" ]; then
    echo -e "\033[0;32m✅ Build files exist\033[0m"
else
    echo -e "\033[0;31m❌ Build files not found. Run: npm run build\033[0m"
    exit 1
fi

# Check if package is linked
if npm list -g n8n-nodes-draiven 2>&1 | grep -q "n8n-nodes-draiven"; then
    echo -e "\033[0;32m✅ Package is globally linked\033[0m"
else
    echo -e "\033[0;33m⚠️  Package not linked. Run: npm link\033[0m"
fi

# Check if n8n is installed
if command -v n8n &> /dev/null; then
    echo -e "\033[0;32m✅ n8n is installed\033[0m"
else
    echo -e "\033[0;31m❌ n8n not found. Install with: npm install -g n8n\033[0m"
fi

echo ""
echo -e "\033[0;36m📋 Next Steps:\033[0m"
echo -e "\033[0;37m1. Ensure your backend is running\033[0m"
echo -e "\033[0;37m2. Run: ./start-n8n-dev.sh\033[0m"
echo -e "\033[0;37m3. Open: http://localhost:5678\033[0m"
echo -e "\033[0;37m4. Search for 'Draiven' in the node panel\033[0m"
echo ""
echo -e "\033[0;36m🔧 Development Mode:\033[0m"
echo -e "\033[0;37mTerminal 1: ./watch-dev.sh  (auto-rebuild on changes)\033[0m"
echo -e "\033[0;37mTerminal 2: ./start-n8n-dev.sh  (run n8n)\033[0m"
