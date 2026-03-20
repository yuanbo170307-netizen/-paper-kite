# Admin Night Stationery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the admin UI into a dark minimal dashboard with a soft stationery aesthetic while preserving all current behaviors.

**Architecture:** Keep the existing route and data flow intact and focus changes in the admin layout, page components, and shared CSS tokens. Use local derived metrics in the project page instead of adding API fields.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind CSS, Vite

---

## Chunk 1: Visual Foundation

### Task 1: Replace the global admin visual baseline

**Files:**
- Modify: `web/src/index.css`

- [ ] Define dark background, shared surface tokens, and utility classes for the admin shell.
- [ ] Add restrained motion and reusable accent styles for panels, chips, and buttons.
- [ ] Preserve the download page compatibility by keeping changes generic and non-breaking.

## Chunk 2: Admin Shell and Home Dashboard

### Task 2: Redesign the shared admin layout

**Files:**
- Modify: `web/src/admin/AdminLayout.tsx`

- [ ] Replace the current pastel header with a darker dashboard top bar.
- [ ] Add breadcrumb-style context and a calmer back action.
- [ ] Wrap the outlet in a centered shell that supports metrics and denser content.

### Task 3: Convert the project page into a dashboard

**Files:**
- Modify: `web/src/admin/pages/ProjectList.tsx`

- [ ] Add local metrics derived from the loaded project list.
- [ ] Redesign the create modal to match the new dark surface language.
- [ ] Replace candy cards with structured project panels and calmer empty states.

## Chunk 3: App and Version Pages

### Task 4: Refresh the app list page

**Files:**
- Modify: `web/src/admin/pages/AppList.tsx`

- [ ] Rebuild the upload area as a compact operations panel.
- [ ] Redesign app rows for clearer density, metadata, and platform labeling.
- [ ] Keep upload progress behavior unchanged.

### Task 5: Refresh the version history page

**Files:**
- Modify: `web/src/admin/pages/VersionList.tsx`

- [ ] Restyle the share modal to match the dark dashboard shell.
- [ ] Rework version rows into a calmer board layout with a clear current marker.
- [ ] Keep set-current and delete actions unchanged.

## Chunk 4: Verification

### Task 6: Validate the redesign

**Files:**
- Verify: `web/src/admin/AdminLayout.tsx`
- Verify: `web/src/admin/pages/ProjectList.tsx`
- Verify: `web/src/admin/pages/AppList.tsx`
- Verify: `web/src/admin/pages/VersionList.tsx`
- Verify: `web/src/index.css`

- [ ] Run `npm run build` in `web` and fix any compile issues.
- [ ] Open the local admin UI and capture fresh screenshots for the updated pages.
- [ ] Confirm responsive usability and unchanged core flows.
