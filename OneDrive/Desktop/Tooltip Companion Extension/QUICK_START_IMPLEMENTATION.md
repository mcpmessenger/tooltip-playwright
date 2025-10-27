# Quick Start - Implementation Guide

**TL;DR:** This guide walks you through starting the implementation of the performance improvements.

---

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Chrome browser
- [ ] Access to the repository
- [ ] Understanding of the current architecture (see IMPLEMENTATION_PLAN.md)

---

## Getting Started (5 Minutes)

### Step 1: Review the Plan

```bash
# Read the implementation plan
cat IMPLEMENTATION_PLAN.md

# Read the sprint summary
cat SPRINT_PLANNING_SUMMARY.md

# Read the task checklist
cat TASK_CHECKLIST.md
```

### Step 2: Verify Current State

```bash
# Check out the main branch
git checkout main
git pull origin main

# Verify backend is running
cd playwright_service
npm install
npm start

# In another terminal, verify extension loads
# Load unpacked in Chrome: chrome://extensions
```

### Step 3: Create First Feature Branch

```bash
# Create branch for Sprint 1
git checkout -b feature/backend-performance-improvements

# Push to remote
git push -u origin feature/backend-performance-improvements
```

---

## Starting Sprint 1 (Backend Performance)

### Task 1.1: Browser Pool Architecture

**Goal:** Replace on-demand browser creation with a pre-warmed pool.

**Files to Modify:**
- `playwright_service/server.js`

**Quick Start:**
```bash
# Create task branch
git checkout -b feat/browser-pool

# Edit the file
code playwright_service/server.js
```

**What to Implement:**
1. Create `BrowserPool` class (see Task 1.1 in IMPLEMENTATION_PLAN.md)
2. Replace `initBrowser()` calls with pool acquisition
3. Implement instance lifecycle
4. Add health checks

**Test It:**
```bash
# Restart backend
npm start

# Test with curl (in another terminal)
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Check metrics
curl http://localhost:3000/health
```

**When Done:**
```bash
# Commit changes
git add playwright_service/server.js
git commit -m "feat: implement browser pool architecture"

# Merge to feature branch
git checkout feature/backend-performance-improvements
git merge feat/browser-pool

# Continue to next task
git checkout -b feat/context-reuse
```

---

## Starting Sprint 2 (Frontend Reliability)

### Task 2.1: Shadow DOM Tooltip

**Goal:** Isolate tooltip from host page CSS/JS.

**Files to Modify:**
- `content.js`

**Quick Start:**
```bash
# Create branch for Sprint 2
git checkout -b feature/shadow-dom-and-offload

# Create task branch
git checkout -b feat/shadow-dom-tooltip

# Edit the file
code content.js
```

**What to Implement:**
1. Find `createTooltipElement()` function (line ~136)
2. Create Shadow DOM host element
3. Move tooltip creation inside Shadow Root
4. Move CSS to Shadow Root

**Test It:**
```bash
# Reload extension in Chrome
# Test on these sites:
# - Gmail
# - LinkedIn
# - GitHub
# - Your banking site

# Verify no CSS conflicts in DevTools
```

**When Done:**
```bash
# Commit changes
git add content.js
git commit -m "feat: implement Shadow DOM for tooltip isolation"

# Merge to feature branch
git checkout feature/shadow-dom-and-offload
git merge feat/shadow-dom-tooltip
```

---

## Starting Sprint 3 (Optimization & Polish)

### Task 3.1: Switch to WebP Format

**Goal:** Reduce file size by 40-50% with same quality.

**Files to Modify:**
- `playwright_service/server.js`
- `content.js`

**Quick Start:**
```bash
# Create branch for Sprint 3
git checkout -b feature/optimization-and-polish

# Create task branch
git checkout -b feat/webp-screenshots

# Edit files
code playwright_service/server.js
code content.js
```

**What to Implement:**
1. Update `page.screenshot()` to use `type: 'webp'`
2. Update MIME type to `image/webp`
3. Update blob creation to use `image/webp`

**Test It:**
```bash
# Restart backend
npm start

# Test screenshot
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Verify smaller file size
```

**When Done:**
```bash
# Commit changes
git add playwright_service/server.js content.js
git commit -m "feat: switch screenshot format to WebP"

# Merge to feature branch
git checkout feature/optimization-and-polish
git merge feat/webp-screenshots
```

---

## Daily Workflow

### Morning Routine
1. Pull latest changes: `git pull`
2. Review task list: `cat TASK_CHECKLIST.md`
3. Start on your assigned task
4. Create task branch

### While Coding
1. Make small, atomic commits
2. Test frequently
3. Write meaningful commit messages
4. Update TASK_CHECKLIST.md

### End of Day
1. Push your work: `git push`
2. Merge task branch to sprint branch
3. Update checklist
4. Update team on progress

---

## Testing Checklist

For each task, test:

### Unit Tests
- [ ] New code works in isolation
- [ ] Edge cases handled
- [ ] Error cases handled

### Integration Tests
- [ ] Works with existing code
- [ ] No regressions
- [ ] Performance improved

### Real-World Tests
- [ ] Test on Gmail
- [ ] Test on LinkedIn
- [ ] Test on GitHub
- [ ] Test on banking site
- [ ] Test on e-commerce site

---

## Quick Reference

### Common Git Commands
```bash
# Create and switch to new branch
git checkout -b feat/feature-name

# Stage changes
git add .

# Commit with message
git commit -m "feat: description"

# Push to remote
git push

# Merge feature branch
git checkout main
git merge feature/feature-name

# Tag release
git tag -a v1.3.0 -m "Performance improvements"
git push origin v1.3.0
```

### Testing Commands
```bash
# Test backend
cd playwright_service
npm test

# Load extension
# Chrome → chrome://extensions → Load unpacked

# Check console
# Right-click → Inspect → Console tab
```

### Common Issues

**Issue: Backend not starting**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

**Issue: Extension not loading**
```bash
# Check manifest.json syntax
# Check for errors in DevTools console
```

**Issue: Performance not improving**
```bash
# Check browser console for errors
# Verify backend metrics
curl http://localhost:3000/health

# Check screenshot latency
# Should be <500ms
```

---

## Need Help?

- **Technical Issues:** See IMPLEMENTATION_PLAN.md
- **Task Assignment:** See TASK_CHECKLIST.md
- **Quick Overview:** See SPRINT_PLANNING_SUMMARY.md
- **Architecture Questions:** See Browser Extension Reliability and Performance Improvement Report.md

---

## Ready to Start?

```bash
# 1. Review the plan
cat IMPLEMENTATION_PLAN.md | less

# 2. Checkout feature branch
git checkout -b feature/backend-performance-improvements

# 3. Pick your first task
git checkout -b feat/browser-pool

# 4. Start coding!
code playwright_service/server.js

# 5. Happy coding! 🚀
```

Remember:
- ✅ Small commits
- ✅ Test frequently
- ✅ Update checklist
- ✅ Ask for help if stuck
- ✅ Have fun!

