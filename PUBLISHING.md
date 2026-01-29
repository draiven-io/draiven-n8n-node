# 📦 Publishing Draiven n8n Node to npm

## Step-by-Step Publishing Guide

### Prerequisites Checklist

Before publishing, ensure:
- ✅ Git repository pushed to GitHub
- ✅ All code is tested and working
- ✅ Documentation is complete
- ✅ Version number is correct in package.json
- ✅ Build directory exists (dist/)
- ✅ npm account created

---

## 🚀 Publishing Steps

### Step 1: Create npm Account (if needed)

If you don't have an npm account:

```bash
# Go to https://www.npmjs.com/signup
# Or create via CLI:
npm adduser
```

Enter:
- Username
- Password
- Email (will be public)
- One-time password (from email)

### Step 2: Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

To verify you're logged in:
```bash
npm whoami
```

### Step 3: Install Dependencies

```bash
cd /home/dhiogo/Projects/draiven/draiven-n8n-node
npm install
```

### Step 4: Build the Project

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Copy icons and assets to dist/
- Prepare the package for publishing

Verify build output:
```bash
ls -la dist/
# Should see:
# - credentials/DraivenApi.credentials.js
# - nodes/Draiven/Draiven.node.js
# - nodes/Draiven/draiven.svg
```

### Step 5: Test the Package Locally (Optional but Recommended)

```bash
# In the draiven-n8n-node directory
npm pack

# This creates a .tgz file (e.g., n8n-nodes-draiven-0.1.0.tgz)
# You can test installing it:
npm install -g ./n8n-nodes-draiven-0.1.0.tgz

# Then test in n8n to make sure it works
```

### Step 6: Verify package.json

Make sure your package.json has:
- ✅ Correct name: "n8n-nodes-draiven"
- ✅ Correct version: "0.1.0"
- ✅ Correct repository URL
- ✅ Keywords include "n8n-community-node-package"
- ✅ "files" includes "dist"
- ✅ n8n section with correct paths

### Step 7: Run Linting (Fix any issues)

```bash
npm run lint
# or to auto-fix:
npm run lintfix
```

### Step 8: Check What Will Be Published

```bash
npm pack --dry-run
```

This shows what files will be included in the package.

### Step 9: Publish to npm! 🚀

For the first time (public package):
```bash
npm publish --access public
```

The `--access public` flag is important for scoped packages to make them public.

### Step 10: Verify Publication

After publishing, verify:

```bash
# Check on npm website
open https://www.npmjs.com/package/n8n-nodes-draiven

# Or test installation
npm install n8n-nodes-draiven
```

---

## 🔄 Publishing Updates

When you make changes and want to publish a new version:

### 1. Update Version

```bash
# For bug fixes (0.1.0 -> 0.1.1)
npm version patch

# For new features (0.1.0 -> 0.2.0)
npm version minor

# For breaking changes (0.1.0 -> 1.0.0)
npm version major
```

This automatically:
- Updates package.json version
- Creates a git commit
- Creates a git tag

### 2. Push to Git

```bash
git push && git push --tags
```

### 3. Rebuild and Publish

```bash
npm run build
npm publish
```

---

## 🚨 Common Issues and Solutions

### Issue: "need auth" or "not logged in"

**Solution:**
```bash
npm login
# Enter your credentials
npm whoami  # Verify
```

### Issue: "Package name already exists"

**Solution:**
- Package name "n8n-nodes-draiven" must be unique
- If taken, you might need to use a scoped package:
  - Change name to: `@draiven/n8n-nodes-draiven`
  - Or: `@yourusername/n8n-nodes-draiven`

### Issue: "You do not have permission to publish"

**Solution:**
```bash
npm publish --access public
```

### Issue: Build errors

**Solution:**
```bash
rm -rf dist/ node_modules/
npm install
npm run build
```

### Issue: "Version already published"

**Solution:**
- You cannot republish the same version
- Update version:
  ```bash
  npm version patch
  npm publish
  ```

### Issue: Missing files in published package

**Solution:**
- Check the "files" array in package.json
- Verify .npmignore doesn't exclude needed files
- Test with: `npm pack --dry-run`

---

## 📋 Pre-Publish Checklist

Use this checklist before each publish:

```bash
# Run this checklist script:
cd /home/dhiogo/Projects/draiven/draiven-n8n-node

echo "Pre-Publish Checklist:"
echo "====================="
echo ""

# 1. Check npm login
echo "1. npm login status:"
npm whoami && echo "✅ Logged in" || echo "❌ Not logged in - run: npm login"
echo ""

# 2. Check dependencies
echo "2. Dependencies installed:"
[ -d "node_modules" ] && echo "✅ node_modules exists" || echo "❌ Run: npm install"
echo ""

# 3. Check build
echo "3. Build exists:"
[ -d "dist" ] && echo "✅ dist/ exists" || echo "❌ Run: npm run build"
[ -f "dist/credentials/DraivenApi.credentials.js" ] && echo "✅ Credentials built" || echo "❌ Build incomplete"
[ -f "dist/nodes/Draiven/Draiven.node.js" ] && echo "✅ Node built" || echo "❌ Build incomplete"
echo ""

# 4. Check version
echo "4. Version in package.json:"
grep '"version"' package.json
echo ""

# 5. Test build
echo "5. Running TypeScript check..."
npx tsc --noEmit && echo "✅ TypeScript OK" || echo "❌ TypeScript errors"
echo ""

# 6. Lint
echo "6. Running linter..."
npm run lint && echo "✅ Lint OK" || echo "⚠️  Lint warnings"
echo ""

echo "====================="
echo "If all checks pass, run: npm publish --access public"
```

---

## 🎯 Quick Command Reference

```bash
# First time setup
npm login
npm install
npm run build

# Publish
npm publish --access public

# Update version and publish
npm version patch
npm run build
npm publish

# Check what will be published
npm pack --dry-run

# Test package locally
npm pack
npm install -g ./n8n-nodes-draiven-0.1.0.tgz

# Check published package
npm info n8n-nodes-draiven

# Unpublish (within 72 hours only!)
npm unpublish n8n-nodes-draiven@0.1.0
```

---

## 🌟 After Publishing

### 1. Update GitHub Repository

Add npm badge to README:
```markdown
[![npm version](https://badge.fury.io/js/n8n-nodes-draiven.svg)](https://www.npmjs.com/package/n8n-nodes-draiven)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-draiven.svg)](https://www.npmjs.com/package/n8n-nodes-draiven)
```

### 2. Submit to n8n Community

- Go to https://github.com/n8n-io/n8n-nodes-registry
- Submit your node for inclusion in the official registry
- Follow their contribution guidelines

### 3. Announce

- Tweet about it
- Post on LinkedIn
- Share in n8n community forum
- Add to Draiven documentation

### 4. Monitor

- Watch npm download stats
- Monitor GitHub issues
- Respond to user feedback
- Plan updates based on usage

---

## 📊 Post-Publication Dashboard

Check these after publishing:

- **npm Package**: https://www.npmjs.com/package/n8n-nodes-draiven
- **npm Stats**: https://npm-stat.com/charts.html?package=n8n-nodes-draiven
- **GitHub Repo**: https://github.com/draiven-io/n8n-nodes-draiven
- **n8n Registry**: https://www.npmjs.com/search?q=keywords:n8n-community-node-package

---

## 🆘 Need Help?

- **npm Documentation**: https://docs.npmjs.com/
- **n8n Community Nodes**: https://docs.n8n.io/integrations/community-nodes/
- **npm Support**: https://www.npmjs.com/support

---

## ✅ Ready to Publish?

Run these commands now:

```bash
cd /home/dhiogo/Projects/draiven/draiven-n8n-node

# 1. Login (if needed)
npm login

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Publish
npm publish --access public
```

**That's it! Your node will be live on npm and installable by anyone!** 🎉
