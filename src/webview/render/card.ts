// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import type { Card } from '../types.js';
import { esc } from '../esc.js';
import { I } from '../icons.js';

function dueCls(iso: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(iso + 'T00:00:00');
  if (due < today)  return 'due-over';
  if (due.getTime() === today.getTime()) return 'due-today';
  return 'due-ok';
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function cardAgeBadge(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  if (days < 3) return '';
  let label: string;
  if (days < 7)   label = `${days}d`;
  else if (days < 30) label = `${Math.floor(days / 7)}w`;
  else if (days < 365) label = `${Math.floor(days / 30)}m`;
  else label = `${Math.floor(days / 365)}y`;
  const cls = days >= 30 ? 'age-stale' : days >= 7 ? 'age-warn' : 'age-ok';
  return `<span class="age-badge ${cls}">${label}</span>`;
}

export function renderCard(card: Card, colId: string): string {
  let displayTitle = card.title;
  if (!displayTitle && card.description) {
    const firstLine = card.description.split('\n')[0]
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    displayTitle = firstLine.slice(0, 80);
  }

  const prioHtml = card.priority && card.priority !== 'none'
    ? `<span class="priority priority-${esc(card.priority)}">${esc(card.priority)}</span>`
    : '';
  const tagItems = card.tags?.length
    ? card.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')
    : '';
  const dueHtml = card.dueDate
    ? `<span class="due-badge ${dueCls(card.dueDate)}">${I.clock} ${fmtDate(card.dueDate)}</span>`
    : '';

  const cl = card.checklist ?? [];
  const checklistBadge = cl.length
    ? (() => {
        const done  = cl.filter(i => i.done).length;
        const total = cl.length;
        return `<span class="checklist-badge${done === total ? ' all-done' : ''}">${I.check} ${done}/${total}</span>`;
      })()
    : '';

  const ageHtml     = card.createdAt ? cardAgeBadge(card.createdAt) : '';
  const colorHex    = card.color
    ? `<span class="card-color-hex" style="color:${esc(card.color)}"><svg viewBox="0 0 10 11.6" fill="currentColor" width="10" height="11.6"><polygon points="5,0 10,2.9 10,8.7 5,11.6 0,8.7 0,2.9"/></svg></span>`
    : '';
  const descIcon    = card.description
    ? `<span class="desc-indicator" title="Has description">${I.text}</span>`
    : '';

  const hasFooter = !!(colorHex || descIcon || tagItems || prioHtml || dueHtml || checklistBadge || ageHtml);

  return `
    <div class="card${card.pinned ? ' pinned' : ''}" draggable="true" data-act="edit-card" data-card="${esc(card.id)}" data-col="${esc(colId)}">
      ${card.pinned ? `<span class="pin-indicator" title="Pinned">${I.pin}</span>` : ''}
      <button class="card-btn del card-del-btn" data-act="del-card" data-card="${esc(card.id)}" data-col="${esc(colId)}" title="Delete">${I.trash}</button>
      ${displayTitle ? `<div class="card-title">${esc(displayTitle)}</div>` : '<div class="card-title" style="opacity:0.4">(no title)</div>'}
      ${hasFooter ? `<div class="card-footer">${colorHex}${descIcon}${tagItems}${prioHtml}${dueHtml}${checklistBadge}${ageHtml}</div>` : ''}
    </div>`;
}
