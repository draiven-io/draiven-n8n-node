#!/bin/bash

# Final publish command - everything is ready!

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚀 Publishing Draiven n8n Node to npm             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in
if ! npm whoami &> /dev/null; then
    echo "❌ You need to login to npm first"
    echo ""
    echo "Run: npm login"
    echo ""
    exit 1
fi

USERNAME=$(npm whoami)
echo "✓ Logged in as: $USERNAME"
echo ""
echo "Package: n8n-nodes-draiven"
echo "Version: 0.1.0"
echo ""
echo "This will publish your package to npm."
echo "Press ENTER to continue or Ctrl+C to cancel..."
read -r

echo ""
echo "Publishing..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              ✓ SUCCESSFULLY PUBLISHED! 🎉                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your package is now live at:"
    echo "🔗 https://www.npmjs.com/package/n8n-nodes-draiven"
    echo ""
    echo "Users can install it with:"
    echo "   npm install n8n-nodes-draiven"
    echo ""
    echo "Or in n8n:"
    echo "   Settings → Community Nodes → Install n8n-nodes-draiven"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Share on social media"
    echo "   2. Update your documentation"
    echo "   3. Submit to n8n community registry"
    echo ""
else
    echo ""
    echo "❌ Publishing failed. Check the error above."
    exit 1
fi
