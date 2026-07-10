# EPMS V2 — Lessons Learned

This file is a permanent record of corrections, judgment calls, and mistakes encountered during the V2 UI modernization engagement. Entries follow the Issue / Why / Rule / Better approach format.

---

### Entry 1 — `.status-badge-inline` class dropped before implementation
**Issue:** Phase 1 plan included `.status-badge-inline` as a new utility class for BillingManagement's payment status badge.  
**Why it happened:** Initial audit noted the badge used inline styles instead of `.badge-*` classes, assumed it was a different pattern.  
**Actual finding:** Inspection of `BillingManagement.tsx` (L277-288, L525-536) confirmed the badge is a simple colored status pill — same intent as `.badge-success`/`.badge-destructive`. Only differences: `border-radius: 0.25rem` vs `9999px`, slightly different hex values. Trivially covered by existing classes.  
**Rule to prevent repetition:** Before adding a new utility class, verify the existing class set can't already cover the pattern — check actual rendered output, not just "it's inline."  
**Better future approach:** File-level inspection before planning class additions, not after.

---

### Entry 2 — App.css identified as dead code
**Issue:** `client/src/App.css` (185 lines) contains Vite scaffold boilerplate (`.counter`, `.hero`, `#center`, `#next-steps`).  
**Why it exists:** Default Vite template file, never cleaned up when real pages were built.  
**Verification:** Grep confirmed zero imports of `App.css` across all `.tsx` files.  
**Action:** Will be deleted in Phase 1. Zero behavioral risk.

---
