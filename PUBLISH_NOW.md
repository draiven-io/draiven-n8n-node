# 🚀 Quick Publish to npm - Simple Steps

## ⚡ Super Quick Method (Automated)

```bash
cd /home/dhiogo/Projects/draiven/draiven-n8n-node
./publish.sh
```

This script will:
1. Check if you're logged in (if not, prompt you to login)
2. Run all pre-publish checks
3. Ask for confirmation
4. Publish to npm

---

## 📝 Manual Method (Step by Step)

### 1. Login to npm

```bash
npm login
```

You'll be prompted for:
- **Username**: Your npm username
- **Password**: Your npm password  
- **Email**: Your email (public)
- **OTP**: One-time password (if 2FA enabled)

Don't have an account? Create one at: https://www.npmjs.com/signup

### 2. Verify Login

```bash
npm whoami
```

Should display your username.

### 3. Run Pre-Publish Check

```bash
./publish-check.sh
```

This validates everything is ready.

### 4. Publish!

```bash
npm publish --access public
```

**Note**: The `--access public` flag is important to make your package publicly available.

### 5. Verify

Visit: https://www.npmjs.com/package/n8n-nodes-draiven

---

## 🎯 That's It!

After publishing, users can install with:

```bash
npm install n8n-nodes-draiven
```

Or in n8n:
1. Settings → Community Nodes
2. Install
3. Enter: `n8n-nodes-draiven`

---

## 🔄 Publishing Updates Later

When you make changes:

```bash
# Update version (choose one):
npm version patch   # 0.1.0 -> 0.1.1 (bug fixes)
npm version minor   # 0.1.0 -> 0.2.0 (new features)
npm version major   # 0.1.0 -> 1.0.0 (breaking changes)

# Rebuild
npm run build

# Publish
npm publish
```

---

## 🆘 Troubleshooting

### "need auth" error
```bash
npm login
```

### "You cannot publish over the previously published versions"
```bash
npm version patch
npm publish
```

### "You do not have permission to publish"
```bash
npm publish --access public
```

### Package name already taken
Change the name in package.json to:
- `@draiven/n8n-nodes-draiven`
- Or another unique name

---

## ✅ Current Status

Your package is **ready to publish**! Everything is built and validated.

**Just run:**
```bash
cd /home/dhiogo/Projects/draiven/draiven-n8n-node
./publish.sh
```

Or manually:
```bash
npm login
npm publish --access public
```

**That's it! You're one command away from being live on npm!** 🎉
