# Antigravity Rules for Ammar Bin Yasir Institute

This document defines the engineering principles and guidelines that must be followed when working on this codebase.

---

## 🏗️ Engineering Principles

### Scalable, Reusable, Component-Based
- Prefer small reusable components over repeating UI blocks
- No magic numbers or hard-coded strings scattered in JSX; use constants/config, props, or shared helpers
- Keep logic in `lib/` (or equivalent) and UI in `components/`

### Read Before Edit
- Before modifying any file, open/read the full file(s) you will touch
- If a change spans multiple files, read them all first, then propose the plan

### Do Not Break Working Features
- Make the smallest change that solves the task
- Preserve existing APIs, routes, component props, and data contracts unless explicitly instructed
- If you must change an interface, update all callers in the same change

### No Duplicates
- Before creating a new component/function, search the codebase for an existing equivalent
- If something similar exists, extend it rather than duplicating
- If a new file is unavoidable, justify why reuse wasn't possible

---

## 🎨 UI/UX Rules

### Maintain Styling System
- Do not change the design system (Tailwind/shadcn/theme tokens, spacing scale, typography rules)
- Reuse existing UI primitives (`Card`, `Button`, `Table`, etc.) and class patterns already in the repo

### Compact Cards
- KPI/stat cards should remain compact: minimal padding, tight spacing, no oversized icons/text
- Prefer 1–2 lines of context + a single prominent value
- Avoid tall cards unless the user asks

### Tables Must Paginate
- Any "main table" listing data should have pagination by default
- Pagination must preserve filters/search/sort state
- Use server-side pagination if data can grow large; otherwise client-side is acceptable

### Mobile Responsiveness is Non-Negotiable
- Must work on 360px width
- No horizontal scrolling on pages
- Use responsive grids, wrap long text, clamp/ellipsis where needed
- Tables degrade gracefully (stacking, compact columns, or horizontal scroll only inside the table container if unavoidable, never the whole page)

### Accessibility Components
- Always add `DialogTitle` to `Sheet` components (required for accessibility)
- Buttons must have labels
- Inputs must have labels
- Avoid clickable divs – use proper button/anchor elements

---

## 📋 Workflow / Progress Tracking

### Track Progress Visibly
- For every task, create a short checklist in the PR/commit message or in a PROGRESS.md file
- Update it as you complete steps: `[ ]` → `[x]`
- Each commit should correspond to a checklist item where possible

### Safe Change Process
1. **Before coding:** State the plan in 3–6 bullets
2. **After coding:** Summarize what changed + what files were touched
3. If uncertain, default to the least risky approach

---

## ✨ Additional Guidelines

### Naming Convention
- Components and functions must have clear, descriptive names
- No `Component1`, `test`, `temp` or similar vague names

### Type Safety
- Don't introduce `any` unless unavoidable
- Prefer proper types/interfaces
- Use the types defined in `lib/types/`

### Performance Sanity
- Avoid unnecessary re-renders
- Memoize expensive derived values when needed
- Use React Query/SWR patterns for data fetching where applicable

### Accessibility Basics
- Buttons have accessible labels
- Form inputs have associated labels
- Interactive elements are keyboard accessible
- ARIA attributes where needed

---

## 📁 Project Structure Reference

```
ammar-bin/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected routes
│   ├── api/                # API routes
│   └── auth/               # Auth pages
├── components/             # React components (UI)
│   ├── ui/                 # Shadcn/Radix primitives
│   └── *.tsx               # Feature components
├── lib/                    # Business logic & utilities
│   ├── auth/               # Auth helpers
│   ├── supabase/           # Database clients
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── hooks/                  # Custom React hooks
├── styles/                 # Global styles
└── public/                 # Static assets
```

---

## 🗄️ Database Access

- **Project ID:** `tshvtbgnfvdodytborbe`
- **Database:** Supabase PostgreSQL 17
- Use MCP tools to query/modify the database
- Always use migrations (`apply_migration`) for DDL changes
- Use `execute_sql` for read queries only

---

## 🔐 User Roles

| Role | Access Level |
|------|--------------|
| `super_admin` | Full system access |
| `admin` | Administrative access |
| `teacher` | Teaching & assessment |
| `accountant` | Finance with audit |
| `cashier` | Finance operations |
| `parent` | Parent portal only |

---

## 🧠 Memory & Context Management

- **Mem0 Integration**: We use `mem0` (via the configured `mem0-mcp` MCP server) as our long-term memory layer.
- **Context Retrieval**: Query the memory store for developer preferences, context, or previous decisions when starting complex tasks.
- **Memory Retention**: Add relevant context, decisions, and system patterns to the mem0 memory store during execution.

---

*Last updated: January 2026*
