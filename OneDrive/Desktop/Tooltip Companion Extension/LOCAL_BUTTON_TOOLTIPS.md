# 🔘 Local Button Tooltips - Implementation Plan

## 🎯 Goal: Show Tooltips on Local Buttons

Current system only shows tooltips for external links. We want to add support for local buttons and interactive elements!

---

## Current Behavior

**External Links:** ✅ Show screenshot preview  
**Local Buttons:** ❌ No tooltip shown

---

## New Feature: Local Button Info Tooltips

### What to Show:
- **Button text** - What it says
- **Button purpose** - What it does  
- **Button state** - Enabled/disabled
- **Icon/emoji** - If present
- **Hints** - Keyboard shortcuts, etc.

---

## Implementation Approach

### Option 1: Quick Info Tooltip (Recommended)
Show a small tooltip with button info:
```
┌─────────────────────────┐
│ 🔘 Submit Form          │
│ Sends the contact form  │
│ 💡 Press Ctrl+S         │
└─────────────────────────┘
```

### Option 2: Screenshot Preview
Take screenshot of page state before/after clicking (more complex)

### Option 3: Element Preview
Show DOM structure around the button (for devs)

**I recommend Option 1** - Fast, simple, useful! ✅

---

## What Information to Extract

For local buttons, we can show:
- **Button text** - e.g., "Submit", "Save", "Delete"
- **Aria-label** - Accessibility label
- **Title attribute** - Tooltip text
- **Form association** - What form it's part of
- **Keyboard shortcut** - If available
- **State** - Enabled/disabled
- **Purpose** - Inferred from text/label

---

## Implementation Steps

1. **Detect local button** (no URL)
2. **Extract button info** (text, label, purpose)
3. **Show info tooltip** (text-based, not screenshot)
4. **Style differently** from link tooltips

---

## User Experience

### Hover over submit button:
```
┌─────────────────────────────┐
│ 🔘 Submit Contact Form      │
│                             │
│ This button sends your      │
│ message to the support team │
│                             │
│ Keyboard: Enter or Ctrl+S   │
└─────────────────────────────┘
```

**Much more useful than nothing!** ✅

---

## Ready to Implement?

I can add this feature now. It will:
- ✅ Detect local buttons
- ✅ Extract button info
- ✅ Show informative tooltips
- ✅ Work alongside link tooltips
- ✅ Be fast and lightweight

**Should I implement this?** 🚀

