# Changelog

## [1.0.1] — 2026-05-27

- Add screenshots to README

## [1.0.0] — 2026-05-26

### Initial release

- Multiple boards with drag-and-drop tab reordering
- Columns with color coding, WIP limits, collapse, and drag-and-drop reordering
- Cards with title, description (Markdown), priority, tags, due dates, label colors, and checklists
- Drag-and-drop cards between and within columns
- Card pinning — pinned cards stay at the top of their column
- Age badge — cards older than 3 days show how long they have been open
- Sort cards per column by Priority, Due Date, Created date, or Title (toggleable, right-click column)
- Search across all cards by title, description, tags, and checklist items (Escape to clear)
- Undo for card, column, board deletions, clear-column, and clone
- Clone card via right-click context menu
- Sidebar panel with board overview and quick card navigation
- Find Card via Command Palette — fuzzy search across all cards
- Export and import boards as JSON
- Reset all data to default board
- Workspace-scoped boards — each project gets its own boards (configurable)
- Configurable default columns via VS Code settings
- Draggable modal dialogs
- Keyboard shortcuts: `N` to add card, `Enter` to submit, `Escape` to close or clear search
- Status bar item with board name and overdue card count
- Fully local — no telemetry, no network requests, no runtime dependencies
