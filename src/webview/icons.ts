// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

export const I = {
  search:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4"/><line x1="9.5" y1="9.5" x2="14" y2="14"/></svg>`,
  plus:    `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2.5" x2="8" y2="13.5"/><line x1="2.5" y1="8" x2="13.5" y2="8"/></svg>`,
  close:   `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>`,
  chevron: `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,5.5 8,10.5 13,5.5"/></svg>`,
  trash:   `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5,4 13.5,4"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><rect x="3.5" y="4" width="9" height="9.5" rx="1"/></svg>`,
  pencil:  `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"/></svg>`,
  dots:    `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="2.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="13.5" cy="8" r="1.4"/></svg>`,
  kanban:  `<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="0.8" y="3" width="14.4" height="2.2" rx="1.1"/><path fill-rule="evenodd" d="M1.5,5.2 Q1.5,14 8,14 Q14.5,14 14.5,5.2 Z M3,7 h2.5 v3.5 h-2.5 Z M6.75,7 h2.5 v2.3 h-2.5 Z M10.5,7 h2.5 v4 h-2.5 Z"/></svg>`,
  check:   `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5,8 6,12 13.5,4"/></svg>`,
  warning: `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2L14.5 13.5H1.5z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg>`,
  grip:    `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5.5" cy="5" r="1.1"/><circle cx="5.5" cy="8" r="1.1"/><circle cx="5.5" cy="11" r="1.1"/><circle cx="10.5" cy="5" r="1.1"/><circle cx="10.5" cy="8" r="1.1"/><circle cx="10.5" cy="11" r="1.1"/></svg>`,
  boards:  `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
  clock:   `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><polyline points="8,5 8,8 10.5,10"/></svg>`,
  arrowUp:   `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="12" x2="8" y2="4"/><polyline points="4.5,7.5 8,4 11.5,7.5"/></svg>`,
  arrowDown: `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="4" x2="8" y2="12"/><polyline points="4.5,8.5 8,12 11.5,8.5"/></svg>`,
  pin:       `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5.5" r="3"/><line x1="8" y1="8.5" x2="8" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  text:      `<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"><line x1="2.5" y1="5" x2="13.5" y2="5"/><line x1="2.5" y1="8.5" x2="13.5" y2="8.5"/><line x1="2.5" y1="12" x2="9.5" y2="12"/></svg>`,
} as const;
