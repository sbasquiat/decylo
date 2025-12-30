# GitHub Deployment Guide

**Status:** ✅ Git repository initialized and ready to push

---

## 🚀 **Step-by-Step: Push to GitHub**

### **Step 1: Create GitHub Repository**

1. Go to [GitHub.com](https://github.com)
2. Click **"New repository"** (or the **+** icon)
3. **Repository name:** `decisionOps` (or your preferred name)
4. **Description:** "Decylo - Judgment training system"
5. **Visibility:** 
   - **Private** (recommended - contains business logic)
   - Or **Public** (if you want it open source)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

---

### **Step 2: Add Remote and Push**

**After creating the repository, GitHub will show you commands. Use these:**

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/decisionOps.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/decisionOps.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Or run these commands in your terminal:**

```bash
cd /Users/seun.badejo/decisionOps

# Add remote (you'll need to replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/decisionOps.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

### **Step 3: Verify Push**

1. Go to your GitHub repository page
2. You should see all your files
3. Verify `.env.local` is **NOT** in the repository (it should be ignored)

---

## 🔒 **Security Check**

**Before pushing, verify these files are NOT in the repository:**

- ✅ `.env.local` - Should be ignored (contains secrets)
- ✅ `node_modules/` - Should be ignored
- ✅ `.next/` - Should be ignored

**Check with:**
```bash
git ls-files | grep -E "\.env|node_modules|\.next"
```

Should return nothing (or only files that are intentionally tracked).

---

## 📋 **What's Being Pushed**

**✅ Safe to Push:**
- All source code
- Configuration files
- Documentation
- Migration files
- Component files

**✅ Protected (Not Pushed):**
- `.env.local` - Ignored by `.gitignore`
- `node_modules/` - Ignored
- `.next/` - Ignored
- Any other `.env*` files - Ignored

---

## 🚀 **After Pushing to GitHub**

### **Option 1: Deploy to Vercel (Recommended)**

1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Import your `decisionOps` repository
5. **Configure:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. **Environment Variables:**
   - Add all variables from `.env.local`
   - Use **LIVE** Stripe keys
   - Set for **Production** environment
7. Click **"Deploy"**
8. Wait for deployment
9. Your site will be live at `yourproject.vercel.app`
10. Add custom domain (optional)

### **Option 2: Deploy to Netlify**

1. Go to [Netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click **"New site from Git"**
4. Select your repository
5. Configure build settings
6. Add environment variables
7. Deploy

### **Option 3: Deploy to AWS/Other**

Follow your hosting provider's instructions for Next.js deployment.

---

## ✅ **Post-Deployment Checklist**

After deploying:

- [ ] Site loads at production URL
- [ ] Environment variables set
- [ ] Test sign up
- [ ] Test decision creation
- [ ] Test Pro upgrade (with real card, refund)
- [ ] Verify webhook receives events
- [ ] Check security headers
- [ ] Monitor for errors

---

## 🔗 **Quick Commands Reference**

```bash
# Check git status
git status

# See what will be pushed
git ls-files

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/decisionOps.git

# Push to GitHub
git push -u origin main

# Check remote
git remote -v

# View commit history
git log --oneline
```

---

## 🆘 **Troubleshooting**

**Issue: "remote origin already exists"**
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/decisionOps.git
```

**Issue: "Authentication failed"**
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys

**Issue: "Permission denied"**
- Verify you have access to the repository
- Check repository name is correct

---

**Ready to push! Follow Step 1 and Step 2 above.** 🚀

