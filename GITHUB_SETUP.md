# GitHub Setup Guide - CarbonConstruct

## 🎯 Quick Setup (5 Minutes)

### Option 1: Using GitHub Desktop (Easiest)

1. **Download GitHub Desktop**
   - Go to: https://desktop.github.com/
   - Install on your PC

2. **Create Repository**
   - Open GitHub Desktop
   - File → New Repository
   - Name: `carbonconstruct`
   - Local Path: Choose where your files are
   - Click "Create Repository"

3. **Add Your Files**
   - All files should show in "Changes" tab
   - Add commit message: "Initial commit: CarbonConstruct"
   - Click "Commit to main"

4. **Publish to GitHub**
   - Click "Publish repository"
   - Choose Public or Private
   - Click "Publish"

**Done!** Your code is on GitHub.

---

### Option 2: Using Command Line (If You're Comfortable)

```bash
# Navigate to your project folder
cd /path/to/carbonconstruct

# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: CarbonConstruct with 4,500+ materials integration"

# Create GitHub repo (if you have GitHub CLI)
gh repo create carbonconstruct --public --source=. --remote=origin --push

# OR manually:
# 1. Create repo on github.com
# 2. Then run:
git remote add origin https://github.com/YOUR-USERNAME/carbonconstruct.git
git branch -M main
git push -u origin main
```

---

## 📂 What Gets Committed

### ✅ Files That WILL Be Committed:

```
carbonconstruct/
├── index.html
├── css/
│   └── custom.css
├── js/
│   ├── materials-database.js
│   ├── lca-calculator.js
│   ├── scopes-calculator.js
│   ├── compliance.js
│   ├── charts.js
│   ├── storage.js
│   ├── supabase-client.js
│   └── main.js
├── README.md
├── QUICK_START.md
├── PROJECT_SUMMARY.md
├── DEPLOYMENT.md
├── SUPABASE_INTEGRATION.md
├── GITHUB_SETUP.md
├── .gitignore
├── .env.example
└── vercel.json
```

### ❌ Files That WON'T Be Committed (Protected):

```
.env.local          # Your Supabase credentials (SECRET!)
.env                # Any environment secrets
node_modules/       # If you add any npm packages
.vercel/            # Vercel build files
.DS_Store          # Mac system files
```

These are already in `.gitignore` so they're safe!

---

## 🔐 Keeping Secrets Safe

### CRITICAL: Never Commit These!

```bash
# ❌ NEVER commit .env.local
# ❌ NEVER commit .env
# ❌ NEVER commit API keys directly in code
```

### ✅ Proper Way to Handle Secrets:

1. **Local Development**:
   ```bash
   # Create .env.local (already in .gitignore)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
   ```

2. **Commit .env.example Instead**:
   ```bash
   # .env.example (SAFE to commit - no real values)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **On Vercel** (after deployment):
   - Add secrets in Vercel Dashboard → Settings → Environment Variables
   - Never in code!

---

## 📝 Good Commit Messages

### Format:
```
Type: Brief description

Longer explanation if needed
```

### Examples:

**Good:**
```bash
git commit -m "feat: Add Supabase integration for 4,500+ materials"
git commit -m "fix: Resolve chart rendering issue on mobile"
git commit -m "docs: Update README with deployment instructions"
git commit -m "style: Improve compliance badge colors"
```

**Bad:**
```bash
git commit -m "update"
git commit -m "fix stuff"
git commit -m "asdf"
```

### Common Prefixes:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, no code change
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

---

## 🌿 Branching Strategy (Optional but Professional)

### Simple Workflow (Recommended for Solo):

```bash
# Main branch = production (always deployable)
main

# Work on features in branches
feature/supabase-integration
feature/material-search
fix/chart-mobile-bug

# Merge when ready
```

### How to Use Branches:

```bash
# Create feature branch
git checkout -b feature/material-search

# Make changes, commit
git add .
git commit -m "feat: Add material search functionality"

# Push to GitHub
git push origin feature/material-search

# On GitHub, create Pull Request
# Review, then merge to main

# Switch back to main
git checkout main
git pull
```

---

## 📊 Repository Settings

### Recommended Settings on GitHub:

1. **Description**:
   ```
   Embodied carbon calculator for Australian construction with 4,500+ materials, LCA analysis, and compliance checking (NCC, NABERS, GBCA)
   ```

2. **Topics (Tags)**:
   ```
   construction, carbon-calculator, sustainability, lca, embodied-carbon, 
   australia, supabase, vercel, green-building, ncc, nabers, gbca
   ```

3. **Website**:
   ```
   https://carbonconstruct.vercel.app (your deployed URL)
   ```

4. **README.md** (Already Created):
   - Shows up as repo homepage
   - Professional documentation
   - Attracts contributors

---

## 🔄 Typical Workflow

### Day-to-Day Development:

```bash
# 1. Pull latest changes (if working with others)
git pull

# 2. Make changes to files
# (edit code, test locally)

# 3. Check what changed
git status

# 4. Add changed files
git add .
# Or specific files:
git add js/main.js

# 5. Commit with message
git commit -m "feat: Add EPD badge filtering"

# 6. Push to GitHub
git push

# 7. Vercel auto-deploys (if connected)
# Check deployment at vercel.com/dashboard
```

---

## 🚀 Connecting GitHub to Vercel

This makes deployment automatic:

### Setup (One Time):

1. **Go to vercel.com/dashboard**
2. **New Project**
3. **Import Git Repository**
4. **Select your GitHub repo** (`carbonconstruct`)
5. **Configure**:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty for static site)
   - Output Directory: (leave empty)
6. **Environment Variables**:
   - Add: `NEXT_PUBLIC_SUPABASE_URL`
   - Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. **Deploy**

### After Setup:

```bash
# Every time you push to GitHub:
git push

# Vercel automatically:
# 1. Detects the push
# 2. Builds your site
# 3. Deploys to production
# 4. Sends you notification
# 
# Takes ~30 seconds!
```

---

## 📦 README Badge Ideas

Add these to your README.md for professional look:

```markdown
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Materials](https://img.shields.io/badge/materials-4500+-brightgreen)
![Status](https://img.shields.io/badge/status-production-success)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/carbonconstruct)
```

---

## 🤝 Making It Open Source (Optional)

### Benefits:
- Portfolio piece for potential clients
- Community contributions
- Industry credibility
- Help other builders

### How to:

1. **Choose Public** when creating repo
2. **Add LICENSE** file:
   ```bash
   # MIT License (most permissive)
   # Allows anyone to use, modify, distribute
   ```
3. **Add CONTRIBUTING.md**:
   ```markdown
   # Contributing
   
   We welcome contributions! Please:
   1. Fork the repo
   2. Create a feature branch
   3. Make your changes
   4. Submit a Pull Request
   ```

### What to Include in Public Repo:
- ✅ All code
- ✅ Documentation
- ✅ Example data (sample materials)
- ❌ Your Supabase credentials (use .env.example instead)
- ❌ Any proprietary client data

---

## 🎓 Learning Resources

### Git Basics:
- https://try.github.io/
- https://learngitbranching.js.org/

### GitHub:
- https://docs.github.com/en/get-started

### Best Practices:
- https://github.com/git-tips/tips

---

## 🐛 Common Issues & Solutions

### "fatal: not a git repository"
```bash
# You're in wrong folder, navigate to project:
cd /path/to/carbonconstruct
git init
```

### "Permission denied (publickey)"
```bash
# Need to set up SSH key or use HTTPS
# Use GitHub Desktop instead (easier)
```

### "rejected: non-fast-forward"
```bash
# Someone else pushed, you need to pull first:
git pull --rebase
# Then push:
git push
```

### "merge conflict"
```bash
# Files have conflicting changes
# Open the file, look for:
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> branch-name

# Choose which to keep, remove markers, then:
git add .
git commit -m "fix: Resolve merge conflict"
```

---

## 📱 GitHub Mobile App

**Useful for monitoring on the go:**
- iOS: https://apps.apple.com/app/github/id1477376905
- Android: https://play.google.com/store/apps/details?id=com.github.android

Can view code, issues, PRs, but not edit (use PC for that).

---

## ✅ GitHub Setup Checklist

- [ ] Repository created on GitHub
- [ ] All files committed (check git status)
- [ ] .env.local NOT committed (in .gitignore)
- [ ] README.md looks good on GitHub
- [ ] Repository description added
- [ ] Topics/tags added
- [ ] License added (if open source)
- [ ] Connected to Vercel for auto-deploy
- [ ] Environment variables set in Vercel
- [ ] First deployment successful
- [ ] Custom domain configured (optional)

---

## 🎯 Next Steps After GitHub Setup

1. **Test the auto-deploy**:
   ```bash
   # Make a small change
   echo "// Test" >> README.md
   git add .
   git commit -m "test: Verify auto-deployment"
   git push
   
   # Check Vercel dashboard - should auto-deploy!
   ```

2. **Share your repo**:
   - Add to LinkedIn portfolio
   - Share with colleagues
   - Add to your website

3. **Set up GitHub Actions** (optional - CI/CD):
   - Auto-test on every commit
   - Auto-deploy to production
   - Advanced, but powerful

---

## 💡 Pro Tips

1. **Commit often** - Small, frequent commits are better than huge ones
2. **Write good messages** - Your future self will thank you
3. **Use branches** - Keep main branch clean
4. **Pull before push** - Avoid conflicts
5. **Read the diff** - Review changes before committing
6. **Tag releases** - v1.0.0, v1.1.0, etc.

```bash
# Create a release tag
git tag -a v1.0.0 -m "Version 1.0.0: Initial production release"
git push origin v1.0.0
```

---

## 🎉 You're Set!

With GitHub setup:
- ✅ Code is backed up
- ✅ Version history tracked
- ✅ Can collaborate with others
- ✅ Professional portfolio piece
- ✅ Auto-deploys to Vercel
- ✅ Industry best practices

**From tools to code - you're building like a pro, Steve!** 🔨💻

---

**Quick Reference:**

```bash
# Daily workflow
git pull              # Get latest
# (make changes)
git status            # See what changed
git add .             # Stage all changes
git commit -m "msg"   # Commit
git push              # Push to GitHub
```

That's it! 🚀
