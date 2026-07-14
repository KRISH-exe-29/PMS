# EPMS V2 — UI Modernization TODO

## Pre-Implementation
- [x] Repository analysis completed (architecture note attached below)
- [x] Design system tokens planned (elevation tiers, spacing scale, typography)
- [x] framer-motion animation plan documented (which primitive per component)
- [x] Dead code identified (App.css) — logged in tasks/lessons.md

## Phase 1: Foundation — index.css Design System Extension
- [x] Elevation tiers: `--glass-1` (subtle), `--glass-2` (default), `--glass-3`/`.glass-elevated`
- [x] Spacing scale: `--space-1` through `--space-8`
- [x] Typography: `--font-weight-display: 800`
- [x] New classes: `.glass-subtle`, `.glass-elevated`
- [x] New classes: `.skeleton`, `.skeleton-text`, `.skeleton-card`
- [x] New classes: `.empty-state`
- [x] New classes: `.progress-bar`, `.progress-fill`
- [x] New classes: `.action-btn`
- [x] New classes: `.view-modal-header`, `.view-modal-grid`
- [x] Responsive breakpoints: `@media (max-width: 1024px)`, `@media (max-width: 768px)`
- [x] Enhanced animations: stagger-fade-in, table hover, btn spring, input focus glow
- [x] Delete App.css (dead code)
- [x] ✅ Verify: `npm run build` + `npm run lint` pass

## Phase 2: Shell — DashboardLayout.tsx
- [x] Import framer-motion (motion, AnimatePresence)
- [x] Sidebar: migrate inline styles to CSS classes
- [x] Sidebar nav items: motion.div whileHover/whileTap (replace onMouseOver/onMouseOut)
- [x] Route transition: wrap <Outlet /> in motion.div fade/slide
- [x] Loading state: glass skeleton layout
- [x] Responsive: sidebar collapse to icon-only at 1024px
- [x] ✅ Verify: build + lint + functional equivalence check

## Phase 3: Validation — Login.tsx
- [x] Migrate inline styles to CSS classes (keep dark aesthetic standalone)
- [x] motion.div entrance animation for login card
- [x] Form field focus micro-interaction
- [x] Submit button loading state animation
- [x] Polish existing dark aesthetic (spacing, shadows, glass)
- [x] ✅ Verify: build + lint + auth flow unchanged

## Phase 4: Pattern Validation — Dashboard.tsx
- [x] KPI cards: .glass-elevated, --font-weight-display, motion.div stagger-in
- [x] Charts: glass card wrapper upgrade (no data/config changes)
- [x] Recent projects table: motion.tr stagger-in
- [x] Progress bars: migrate inline → .progress-bar/.progress-fill
- [x] Loading states: skeleton placeholders
- [x] Empty states: .empty-state with lucide-react icon
- [x] ✅ Verify: build + lint + functional equivalence check

## Phase 5: Medium Pages
### TeamManagement.tsx
- [x] Table row stagger
- [x] Modal AnimatePresence (Add/Edit & View)
- [x] Button refinement (Action buttons → .action-btn)
- [x] View modal → .glass-elevated, .view-modal-header
- [x] ✅ Verify: build + lint + functional equivalence

### BudgetManagement.tsx
- [x] Summary cards → .glass-elevated
- [x] Table row stagger
- [x] Button refinement
- [x] View modal → .glass-elevated, .view-modal-header
- [x] ✅ Verify: build + lint + functional equivalence

### EmailNotification.tsx
- [x] Table row stagger
- [x] Cards → .glass-elevated
- [x] ✅ Verify: build + lint + functional equivalence check

## Phase 6: Larger Pages
### ProjectManagement.tsx
- [x] Table stagger, skeleton loading
- [x] Action buttons → .action-btn
- [x] View modal (Complex tabs) → AnimatePresence + .view-modal-header
- [x] Edit modal → AnimatePresence + standard layout
- [x] ✅ Verify: build + lint + functional equivalence

### GanttChart.tsx
- [x] Migrate safe inline styles (headers, tabs, tooltips)
- [x] Tab buttons → refined hover states
- [x] ✅ Verify: build + lint + functional equivalence

### MilestoneManagement.tsx
- [x] 2 modals → AnimatePresence, table stagger, action buttons
- [x] ✅ Verify: build + lint + functional equivalence

### TaskManagement.tsx
- [x] Stagger massive table
- [x] Tab style refactor
- [x] Extracted View Modal HTML
- [x] Verify document upload styling + functional equivalence

### DPR.tsx
- [x] Modals, table, progress bar migration
- [x] ✅ Verify: build + lint + functional equivalence

### DocumentManagement.tsx
- [x] Add .folder-table to index.css (additive)
- [x] Inner table → .folder-table class
- [x] Folder tree items → CSS class
- [x] Upload drop zone → glass card
- [x] Upload modal → AnimatePresence
- [x] ✅ Verify: build + lint + functional equivalence

### BillingManagement.tsx
- [x] Payment badge → .badge-success/.badge-destructive (standard classes)
- [x] 2 modals → AnimatePresence
- [x] Table → row stagger
- [x] ✅ Verify: build + lint + functional equivalence

## Phase 7: Highest Risk — TaskManagement.tsx
- [x] Tab system → refined tab styling with active indicator animation
- [x] 2 modals → AnimatePresence
- [x] Table → row stagger
- [x] File upload input → styled consistently
- [x] Action buttons → .action-btn
- [x] Loading/empty states → skeleton + .empty-state
- [x] ✅ Verify: build + lint + functional equivalence

## Phase 8: Responsive Pass
- [x] All pages verified at 1024px breakpoint
- [x] All pages verified at 768px breakpoint
- [x] Performance check: blur/stagger frame-rate on TaskManagement
- [x] ✅ Final: build + lint clean across entire project

## Post-Implementation
- [x] tasks/todo.md updated with final status and file list
- [x] tasks/lessons.md updated with all corrections

---

## Architecture Note (from STEP 1 investigation)

**Styling patterns per file:**
| File | Primary Styling | Shared Classes Used | Key Patterns |
|---|---|---|---|
| DashboardLayout | 95% inline style={{}} | .glass, .app-container, .main-content, .page-content, .btn, utilities | Sidebar + header shell, auth guard |
| Login | 99% inline style={{}} | .form-group only (2x) | Standalone dark theme |
| Dashboard | Both class + inline | .card, .glass-card, .data-table, badges, utilities | KPI cards, recharts, table |
| ProjectManagement | Both | Full standard set (page-header, data-table, modal-*, form-*, badge-*, btn-*) | 2 modals, CRUD table |
| GanttChart | Mostly inline | .flex, .btn, .card, utilities | gantt-task-react lib, custom components |
| MilestoneManagement | Both | Same as ProjectManagement | 2 modals, bulk select |
| TaskManagement | Both | Same as ProjectManagement + text-primary for doc links | 2 modals, tabs, file upload |
| TeamManagement | Both | Standard set | 2 modals, cleanest CRUD page |
| DPR | Both | Standard set | 2 modals, progress bar |
| BudgetManagement | Both | .card, .data-table, .badge-*, .btn-*, .modal-* | 1 view modal, recharts PieChart |
| DocumentManagement | Both | .card, .glass-card, .form-*, .btn-*, .modal-* | Custom inline table, folder tree, drag-drop upload |
| EmailNotification | Mostly className | Standard set | Cleanest page, localStorage-only |
| BillingManagement | Both | Standard set (minus badges — uses inline) | 2 modals, file upload via ref |

**framer-motion usage:** ZERO imports across all files (confirmed)
**react-hook-form usage:** ZERO imports (all forms use raw useState)
**@tanstack/react-table usage:** ZERO imports (all tables are manual)
