# Admin Night Stationery Design

**Goal:** Redesign the `/admin` management UI into a dark, minimal operations dashboard with a soft Japanese stationery feel, without changing backend behavior or route structure.

## Visual Direction

- Use a deep blue-gray background instead of pastel gradients.
- Keep the interface minimal and tool-like, then add warmth through rounded corners, muted accent chips, and soft highlight panels.
- Replace emoji-led styling with restrained iconography, labels, and surface hierarchy.

## Layout

- `AdminLayout` becomes a full-height dashboard shell with a compact top bar and centered content column.
- The project homepage adds a lightweight metrics row above the project list.
- Project cards become structured panels with clearer metadata and restrained accent headers.
- The app list page uses a denser upload panel plus cleaner list rows.
- The version page uses a board-like history list with a stronger “current version” state and a darker share modal.

## Color and Typography

- Base background: deep slate / blue-gray.
- Surface colors: layered charcoal panels with subtle borders.
- Accent colors: muted cream, mint, powder blue, and blush used sparingly.
- Typography should emphasize hierarchy through weight and spacing, not strong color.

## Interaction

- Preserve existing routes, modals, and upload behavior.
- Use hover states, borders, and soft shadows for feedback instead of animated candy gradients.
- Keep empty states calm and compact.

## Constraints

- No API changes.
- No route changes.
- No new runtime dependencies.
- Responsive behavior must remain usable on laptop and mobile widths.
