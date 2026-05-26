// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import type { Column, Card, ColSort, Board } from '../types.js';
import { appState, searchQuery, filtered, dragOverCol, dragOverColReorder, currentBoard } from '../state.js';
import { esc } from '../esc.js';
import { I } from '../icons.js';
import { renderCard } from './card.js';

const PRIO_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

function sortCards(cards: Card[], sort: ColSort | undefined): Card[] {
  const pinned   = cards.filter(c => c.pinned);
  const unpinned = cards.filter(c => !c.pinned);
  if (!sort) return [...pinned, ...unpinned];
  const sorted = [...unpinned].sort((a, b) => {
    if (sort === 'priority') return (PRIO_ORDER[a.priority] ?? 3) - (PRIO_ORDER[b.priority] ?? 3);
    if (sort === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sort === 'created') return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    if (sort === 'title')   return (a.title ?? '').localeCompare(b.title ?? '');
    return 0;
  });
  return [...pinned, ...sorted];
}

export function renderBoardArea(): string {
  if (!appState.boards.length) return renderEmptyApp();

  const board = currentBoard();
  if (!board) return renderEmptyApp();

  const activeCols = board.columns;

  if (!activeCols.length) {
    return `
      <div class="board">
        <div class="board-empty">
          <div class="board-empty-icon">${I.kanban}</div>
          <h2>No columns yet</h2>
          <p>Add your first column to start organising tasks.</p>
          <button class="btn btn-primary" data-act="add-col">${I.plus} Add Column</button>
        </div>
      </div>`;
  }

  const isSearching       = !!searchQuery.trim();
  const anyResults        = activeCols.some(c => filtered(c.cards).length > 0);
  const firstNonCollapsed = activeCols.find(c => !c.collapsed)?.id ?? null;

  if (isSearching && !anyResults) {
    return `
      <div class="board">
        <div class="no-results">
          <div class="no-results-title">No results for &ldquo;${esc(searchQuery)}&rdquo;</div>
          <div class="no-results-hint">Searches title, description and tags</div>
          <button class="btn btn-ghost" style="margin-top:6px" data-act="clear-search">Clear search</button>
        </div>
      </div>`;
  }

  return renderStatsBar(board) + `
    <div class="board" id="board">
      ${activeCols.map(c => renderColumn(c, isSearching, c.id === firstNonCollapsed)).join('')}
    </div>`;
}

function renderStatsBar(board: Board): string {
  const todayMs   = new Date(new Date().toDateString()).getTime();
  const allCards  = board.columns.flatMap(c => c.cards);
  const total     = allCards.length;
  const overdue   = allCards.filter(c => c.dueDate && new Date(c.dueDate + 'T00:00:00').getTime() < todayMs).length;
  const dueToday  = allCards.filter(c => c.dueDate && new Date(c.dueDate + 'T00:00:00').getTime() === todayMs).length;

  const parts: string[] = [`<span>${total} card${total !== 1 ? 's' : ''}</span>`];
  if (overdue)  parts.push(`<span class="stat-overdue">${overdue} overdue</span>`);
  if (dueToday) parts.push(`<span class="stat-today">${dueToday} due today</span>`);

  return `<div class="board-stats">${parts.join('<span class="stat-sep">·</span>')}</div>`;
}

function renderEmptyApp(): string {
  return `
    <div class="board">
      <div class="board-empty">
        <div class="board-empty-icon">${I.boards}</div>
        <h2>No boards yet</h2>
        <p>Create your first board to start organising tasks.</p>
        <button class="btn btn-primary" data-act="add-board">${I.plus} New Board</button>
      </div>
    </div>`;
}

function renderColumn(col: Column, isSearching: boolean, isFirstNonCollapsed: boolean): string {
  const sorted = sortCards(col.cards, col.sort);
  const cards  = isSearching ? filtered(sorted) : sorted;
  const total  = col.cards.length;
  const wip    = col.wipLimit;
  const wipOver = wip !== undefined && total > wip;
  const countText = isSearching && cards.length !== total
    ? `${cards.length} of ${total}`
    : `${total}${wip !== undefined ? `/${wip}` : ''}`;
  const count = `<span class="col-count${wipOver ? ' wip-over' : ''}">${countText}${wipOver ? ` ${I.warning}` : ''}</span>`;

  const isColDragOver = dragOverColReorder === col.id;

  return `
    <div class="column${col.collapsed ? ' collapsed' : ''}${dragOverCol === col.id ? ' drag-over' : ''}${isColDragOver ? ' col-reorder-over' : ''}"
         data-col="${esc(col.id)}">
      <div class="col-header">
        <div class="col-drag-handle" draggable="true" data-col="${esc(col.id)}" title="Drag to reorder">
          ${I.grip}
        </div>
        <span class="col-accent" style="color:${esc(col.color)}"><svg viewBox="0 0 10 11.6" fill="currentColor" width="10" height="11.6"><polygon points="5,0 10,2.9 10,8.7 5,11.6 0,8.7 0,2.9"/></svg></span>
        <button class="col-collapse-btn" data-act="toggle" data-col="${esc(col.id)}">
          ${I.chevron}
        </button>
        <span class="col-name">${esc(col.name)}</span>
        ${count}
        <button class="col-menu-btn" data-act="col-menu" data-col="${esc(col.id)}" title="Options">
          ${I.dots}
        </button>
      </div>
      <div class="col-body" data-col="${esc(col.id)}">
        ${cards.length === 0 && !isSearching ? `<div class="col-empty"><span class="col-empty-icon">${I.kanban}</span><span class="col-empty-text">No cards yet</span></div>` : ''}
        ${cards.map(card => renderCard(card, col.id)).join('')}
      </div>
      <button class="col-add-btn" data-act="add-card" data-col="${esc(col.id)}">
        ${I.plus} Add card${isFirstNonCollapsed ? ' <kbd class="shortcut-badge">N</kbd>' : ''}
      </button>
    </div>`;
}
