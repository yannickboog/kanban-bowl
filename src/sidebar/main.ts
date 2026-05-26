// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0


declare const acquireVsCodeApi: () => { postMessage(msg: unknown): void };

interface ChecklistItem { id: string; text: string; done: boolean; }
interface Card {
  id: string; title: string; description: string;
  priority: 'none' | 'low' | 'medium' | 'high';
  tags: string[]; createdAt: string; dueDate?: string;
  color?: string; checklist?: ChecklistItem[]; pinned?: boolean;
}
interface Column { id: string; name: string; color: string; cards: Card[]; collapsed: boolean; }
interface Board  { id: string; name: string; columns: Column[]; }
interface AppState { version: 2; currentBoardId: string | null; boards: Board[]; }

const vscode = acquireVsCodeApi();

let state: AppState = { version: 2, currentBoardId: null, boards: [] };

function currentBoard(): Board | null {
  if (!state.boards.length) return null;
  return state.boards.find(b => b.id === state.currentBoardId) ?? state.boards[0];
}

function priorityClass(p: string): string {
  if (p === 'high')   return 'sb-pri-high';
  if (p === 'medium') return 'sb-pri-med';
  if (p === 'low')    return 'sb-pri-low';
  return '';
}

function dueBadge(card: Card): string {
  if (!card.dueDate) return '';
  const todayMs = new Date(new Date().toDateString()).getTime();
  const dueMs   = new Date(card.dueDate + 'T00:00:00').getTime();
  const cls = dueMs < todayMs ? 'sb-due-over' : dueMs === todayMs ? 'sb-due-today' : 'sb-due-ok';
  const parts = card.dueDate.split('-');
  const label = `${parts[2]}.${parts[1]}`;
  return `<span class="sb-due ${cls}">${label}</span>`;
}

function checklistBadge(card: Card): string {
  if (!card.checklist?.length) return '';
  const done  = card.checklist.filter(i => i.done).length;
  const total = card.checklist.length;
  const cls   = done === total ? 'sb-cl-done' : '';
  return `<span class="sb-cl ${cls}">${done}/${total}</span>`;
}

function render(): void {
  const app   = document.getElementById('app')!;
  const board = currentBoard();

  if (!board) {
    app.innerHTML = `
      <div class="sb-empty">
        <p class="sb-empty-text">No boards yet</p>
        <button class="sb-open-btn" data-action="open">Open Kanban Bowl</button>
      </div>`;
    return;
  }

  const totalCards = board.columns.reduce((n, c) => n + c.cards.length, 0);

  const colsHtml = board.columns.map(col => {
    const cardsHtml = col.cards.map(card => {
      const priCls  = priorityClass(card.priority);
      const hexagon = card.color
        ? `<span class="sb-hex" style="color:${escHtml(card.color)}"><svg viewBox="0 0 10 11.6" fill="currentColor" width="9" height="10.5"><polygon points="5,0 10,2.9 10,8.7 5,11.6 0,8.7 0,2.9"/></svg></span>`
        : '';
      const pinIcon = card.pinned ? `<span class="sb-pin">●</span>` : '';
      return `
        <div class="sb-card" data-action="open-card" data-card-id="${escHtml(card.id)}" data-col-id="${escHtml(col.id)}">
          ${pinIcon}
          <span class="sb-card-title">${cardDisplayTitle(card)}</span>
          <span class="sb-card-meta">
            ${hexagon}
            ${priCls ? `<span class="sb-pri ${priCls}"></span>` : ''}
            ${dueBadge(card)}
            ${checklistBadge(card)}
          </span>
        </div>`;
    }).join('');

    return `
      <div class="sb-col">
        <div class="sb-col-header">
          <span class="sb-col-accent" style="color:${escHtml(col.color)}"><svg viewBox="0 0 10 11.6" fill="currentColor" width="9" height="10.5"><polygon points="5,0 10,2.9 10,8.7 5,11.6 0,8.7 0,2.9"/></svg></span>
          <span class="sb-col-name">${escHtml(col.name)}</span>
          <span class="sb-col-count">${col.cards.length}</span>
        </div>
        <div class="sb-col-cards">${cardsHtml || '<div class="sb-col-empty">Empty</div>'}</div>
      </div>`;
  }).join('');

  const boardTabs = state.boards.length > 1
    ? `<div class="sb-board-tabs">${state.boards.map(b =>
        `<button class="sb-board-tab${b.id === board.id ? ' active' : ''}" data-action="switch-board" data-board-id="${escHtml(b.id)}">${escHtml(b.name)}</button>`
      ).join('')}</div>`
    : '';

  app.innerHTML = `
    <div class="sb-header">
      <span class="sb-board-name">${escHtml(board.name)}</span>
      <button class="sb-open-btn" data-action="open" title="Open full board">Open</button>
    </div>
    ${boardTabs}
    <div class="sb-stats">${totalCards} card${totalCards !== 1 ? 's' : ''} · ${board.columns.length} column${board.columns.length !== 1 ? 's' : ''}</div>
    <div class="sb-cols">${colsHtml}</div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cardDisplayTitle(card: Card): string {
  if (card.title) return escHtml(card.title);
  if (card.description) {
    const first = card.description.split('\n')[0]
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim()
      .slice(0, 80);
    if (first) return escHtml(first);
  }
  return '<span style="opacity:0.4">(no title)</span>';
}

document.addEventListener('click', (e: MouseEvent) => {
  const target = (e.target as Element).closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'open') {
    vscode.postMessage({ type: 'open' });
  } else if (action === 'open-card') {
    vscode.postMessage({ type: 'openCard', cardId: target.dataset.cardId, colId: target.dataset.colId });
  } else if (action === 'switch-board') {
    const boardId = target.dataset.boardId;
    if (boardId && boardId !== state.currentBoardId) {
      state.currentBoardId = boardId;
      vscode.postMessage({ type: 'switchBoard', boardId });
      render();
    }
  }
});

window.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as { type: string; data?: AppState };
  if (msg.type === 'load' && msg.data) {
    state = msg.data;
    render();
  }
});

render();
vscode.postMessage({ type: 'ready' });
