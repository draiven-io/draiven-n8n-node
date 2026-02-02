#!/bin/bash

# Interactive script to help with npm 2FA/token setup

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     npm 2FA Required - Setup Helper                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "npm requires 2FA or an access token to publish packages."
echo ""
echo "Choose an option:"
echo ""
echo "1) Set up with 2FA (more secure, needs OTP each time)"
echo "2) Set up with Access Token (easier, automated)"
echo "3) Exit and set up manually"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║              Setting up 2FA                                ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Steps to enable 2FA:"
        echo ""
        echo "1. Go to: https://www.npmjs.com/settings/$(npm whoami)/tfa"
        echo "2. Click 'Enable 2FA'"
        echo "3. Choose 'Authorization and Publishing'"
        echo "4. Scan QR code with authenticator app"
        echo "5. Enter the code to verify"
        echo "6. Save your recovery codes!"
        echo ""
        read -p "Press ENTER after you've enabled 2FA..."
        echo ""
        echo "Now you can publish with:"
        echo ""
        echo "  npm publish --access public --otp=YOUR_6_DIGIT_CODE"
        echo ""
        echo "Get your OTP code from your authenticator app and run:"
        echo ""
        read -p "Enter OTP code (or press ENTER to skip): " otp
        
        if [ -n "$otp" ]; then
            echo ""
            echo "Publishing with OTP..."
            npm publish --access public --otp=$otp
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "╔════════════════════════════════════════════════════════════╗"
                echo "║              ✓ SUCCESSFULLY PUBLISHED! 🎉                 ║"
                echo "╚════════════════════════════════════════════════════════════╝"
                echo ""
                echo "Your package is live at:"
                echo "https://www.npmjs.com/package/n8n-nodes-draiven"
            else
                echo ""
                echo "❌ Publishing failed. Try running manually:"
                echo "npm publish --access public --otp=YOUR_CODE"
            fi
        else
            echo ""
            echo "No OTP provided. When you're ready, run:"
            echo ""
            echo "  npm publish --access public --otp=YOUR_CODE"
            echo ""
        fi
        ;;
        
    2)
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║           Setting up Access Token                          ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Steps to create an access token:"
        echo ""
        echo "1. Go to: https://www.npmjs.com/settings/$(npm whoami)/tokens"
        echo "2. Click 'Generate New Token'"
        echo "3. Choose 'Automation' type"
        echo "4. Name it: 'Draiven n8n Node Publishing'"
        echo "5. Copy the token (starts with npm_...)"
        echo ""
        read -p "Press ENTER after you've created the token..."
        echo ""
        echo "Now enter your token:"
        read -sp "Token (hidden): " token
        echo ""
        
        if [ -n "$token" ]; then
            echo ""
            echo "Setting up token..."
            npm config set //registry.npmjs.org/:_authToken $token
            
            if [ $? -eq 0 ]; then
                echo "✓ Token configured"
                echo ""
                echo "Publishing..."
                npm publish --access public
                
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "╔════════════════════════════════════════════════════════════╗"
                    echo "║              ✓ SUCCESSFULLY PUBLISHED! 🎉                 ║"
                    echo "╚════════════════════════════════════════════════════════════╝"
                    echo ""
                    echo "Your package is live at:"
                    echo "https://www.npmjs.com/package/n8n-nodes-draiven"
                else
                    echo ""
                    echo "❌ Publishing failed. Check the error above."
                fi
            else
                echo "❌ Failed to configure token"
            fi
        else
            echo ""
            echo "No token provided. Exiting."
        fi
        ;;
        
    3)
        echo ""
        echo "Setup instructions:"
        echo ""
        echo "See FIX_2FA.md for detailed instructions."
        echo ""
        exit 0
        ;;
        
    *)
        echo ""
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
