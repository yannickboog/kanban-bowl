// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

export function esc(s: unknown): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
