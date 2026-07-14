# Amendment — Dark Mode Removed from Phase 1 (Foundation)

Apply this amendment to the "EPMS Version 2 — UI Modernization Implementation Plan"
before sending it to Antigravity. It replaces one bullet in Phase 1, resolves Open
Question Q1, and removes one line from the Final Verification checklist. Nothing
else in the plan changes.

---

## 1. Replace this bullet in Phase 1 → `index.css` changes:

**REMOVE:**
> 4. **Dark mode token set** — `@media (prefers-color-scheme: dark)` block redefining
>    all existing CSS variables with dark-appropriate values. This makes every
>    component automatically dark-mode compatible.

**REPLACE WITH:**
> 4. **Dark mode: OUT OF SCOPE for this engagement.** Do not add a
>    `@media (prefers-color-scheme: dark)` block or any automatic OS-triggered
>    redefinition of the token system. Reasons (do not relitigate mid-implementation):
>    - It changes what a subset of real users see sitewide with no toggle, no
>      staged rollout, and no way to preview it before it's live — that is a
>      behavioral change, not a visual polish, and outside this engagement's
>      "zero behavioral change" contract.
>    - `recharts` fill colors (Dashboard, BudgetManagement) are set as JS props,
>      not CSS variables, and will NOT respond to a CSS-only dark mode block —
>      charts would silently stay light-colored on a dark background, a
>      readability bug shipping on day one in a file used for pattern validation.
>    - If dark mode is wanted later, it should ship as its own explicit,
>      class-based, user-toggled phase (e.g. `[data-theme="dark"]` on `<html>`,
>      flipped by a UI control) — never automatic — so it can be tested and
>      reviewed in isolation, including a pass on every `recharts`/`gantt-task-react`
>      color prop, not just CSS variables.

---

## 2. Resolve Open Question Q1 (Login page dark theme alignment)

**Decision: Option B.**

> Keep Login's standalone dark inline-style aesthetic; only polish the existing
> inline values (spacing, shadow, glass refinement per the general upgrade pass).
> Do NOT migrate it onto a shared dark-mode token system, since no such system
> exists in this engagement (see #1 above). Login having its own fixed dark
> treatment, independent of any site-wide light/dark toggle, is acceptable and
> low-risk as-is.

Remove Q1 from the "Open Questions" section — it's resolved, not pending.

---

## 3. Remove this line from Final Verification:

**REMOVE:**
> - Dark mode activates via `prefers-color-scheme`

No replacement needed — there is nothing to verify since no dark-mode block is
being added.

---

## Net effect on the rest of the plan

Everything else is unchanged:
- Elevation tiers (`--glass-1/2/3`), spacing scale, `--font-weight-display`,
  new utility classes, responsive breakpoints, and enhanced animations in
  Phase 1 all proceed exactly as written.
- Phase 2–8 component work is unaffected — none of it depended on the dark-mode
  block.
- Q2 (DocumentManagement custom table → Option B, `.folder-table`) and
  Q3 (view modal header → Option A, `.view-modal-header`) stand as already
  decided.

This keeps Phase 1 scoped to pure token/utility additions with no
OS-triggered behavioral surface, consistent with the "zero behavioral
change" constraint governing the whole engagement.
