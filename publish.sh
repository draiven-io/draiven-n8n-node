#!/bin/bash

# Quick Publish Script for Draiven n8n Node
# This script will guide you through publishing to npm

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Draiven n8n Node - Quick Publish Guide            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in
if npm whoami &> /dev/null; then
    USERNAME=$(npm whoami)
    echo "✓ Already logged in as: $USERNAME"
    echo ""
else
    echo "You need to login to npm first."
    echo ""
    echo "Do you have an npm account? (y/n)"
    read -r HAS_ACCOUNT
    
    if [ "$HAS_ACCOUNT" = "n" ] || [ "$HAS_ACCOUNT" = "N" ]; then
        echo ""
        echo "Please create an npm account first:"
        echo "1. Go to: https://www.npmjs.com/signup"
        echo "2. Create your account"
        echo "3. Come back and run this script again"
        echo ""
        exit 1
    fi
    
    echo ""
    echo "Running: npm login"
    echo ""
    npm login
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "Login failed. Please try again."
        exit 1
    fi
fi

echo ""
echo "Running pre-publish checks..."
./publish-check.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                   READY TO PUBLISH                         ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Package: n8n-nodes-draiven"
    echo "Version: $(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')"
    echo ""
    echo "This will publish your package to npm registry."
    echo "Are you sure you want to continue? (y/n)"
    read -r CONFIRM
    
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        echo ""
        echo "Publishing to npm..."
        npm publish --access public
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║              ✓ SUCCESSFULLY PUBLISHED! 🎉                 ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo "Your package is now live at:"
            echo "https://www.npmjs.com/package/n8n-nodes-draiven"
            echo ""
            echo "Users can install it with:"
            echo "npm install n8n-nodes-draiven"
            echo ""
            echo "Or in n8n Community Nodes settings."
            echo ""
        else
            echo ""
            echo "✗ Publishing failed. Check the error above."
            exit 1
        fi
    else
        echo ""
        echo "Publishing cancelled."
        exit 0
    fi
else
    echo ""
    echo "Please fix the issues above before publishing."
    exit 1
fi
