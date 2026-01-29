# 🔐 Fix npm 2FA Issue - Publishing Guide

## The Problem
npm requires Two-Factor Authentication (2FA) to publish packages for security.

## Solution Options

Choose ONE of these options:

---

## ✅ **Option 1: Enable 2FA on npm (Recommended)**

### Step 1: Enable 2FA on npm website

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. Click "Enable 2FA"
3. Choose "Authorization and Publishing" (required for publishing)
4. Scan QR code with an authenticator app:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password
5. Enter the code from your authenticator app
6. Save your recovery codes in a safe place!

### Step 2: Publish with OTP

After enabling 2FA, when you publish:

```bash
npm publish --access public --otp=123456
```

Replace `123456` with the 6-digit code from your authenticator app.

**Note**: The OTP expires quickly (30 seconds), so have your authenticator ready!

---

## ✅ **Option 2: Use an Access Token (Easier for Automation)**

### Step 1: Create an Access Token

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Choose "Automation" token (can bypass 2FA for publishing)
4. Name it: "Draiven n8n Node Publishing"
5. Copy the token (starts with `npm_...`)
6. **Save it securely!** You won't see it again.

### Step 2: Login with Token

```bash
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with your actual token.

### Step 3: Publish

```bash
npm publish --access public
```

That's it! No OTP needed with automation tokens.

---

## 🎯 **Quick Steps (Recommended Path)**

### For Quick Publishing (Option 2 is faster):

```bash
# 1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# 2. Create "Automation" token
# 3. Copy the token
# 4. Run this (replace YOUR_TOKEN):

npm config set //registry.npmjs.org/:_authToken npm_YOUR_TOKEN_HERE

# 5. Publish:
npm publish --access public
```

---

## 🔒 **Security Notes**

- **Never commit** your npm token to git
- **Never share** your token publicly
- **Rotate tokens** periodically
- **Use 2FA** for your main npm account even if using tokens

---

## 📝 **After Setting Up**

Once you've chosen an option and set it up:

```bash
cd /home/dhiogo/Projects/draiven/draiven-n8n-node
npm publish --access public

# If using 2FA (Option 1):
npm publish --access public --otp=123456
```

---

## 🚨 **Troubleshooting**

### "Invalid OTP"
- Make sure your system clock is correct
- Get a fresh code from authenticator (they expire)
- Type it quickly after generating

### "Invalid token"
- Make sure you copied the entire token (starts with `npm_`)
- Create a new token if needed
- Use "Automation" type, not "Publish"

### "Still getting 403"
- Verify you're logged in: `npm whoami`
- Try logging out and back in: `npm logout && npm login`
- Clear npm cache: `npm cache clean --force`

---

## ✅ **Which Option to Choose?**

**Choose Option 1 (2FA)** if:
- You'll publish manually
- You want maximum security
- You don't mind entering OTP each time

**Choose Option 2 (Token)** if:
- You want convenience
- You'll automate publishing
- You can store tokens securely

---

## 🎯 **Next Steps**

1. Choose your option (2FA or Token)
2. Follow the steps above
3. Come back and run:
   ```bash
   npm publish --access public
   # OR with 2FA:
   npm publish --access public --otp=YOUR_CODE
   ```

**Your package is ready! Just need to set up authentication.** 🚀
