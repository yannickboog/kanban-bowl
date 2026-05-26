// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import type { AppState, Modal, CtxMenu, Toast, PendingUndo, DragCard, DragColumn, DragBoard } from './types.js';

declare const acquireVsCodeApi: () => { postMessage(msg: unknown): void };

export const vscode = acquireVsCodeApi();

export let appState: AppState = { version: 2, currentBoardId: null, boards: [] };
export let searchQuery = '';
export let modal: Modal | null = null;
export let ctxMenu: CtxMenu | null = null;
export const ctxActions: Record<string, () => void> = {};
export let toast: Toast | null = null;
export let toastTimer: ReturnType<typeof setTimeout> | null = null;
export let pendingUndo: PendingUndo | null = null;
export let dragCard: DragCard | null = null;
export let dragOverCol: string | null = null;
export let dragColumn: DragColumn | null = null;
export let dragOverColReorder: string | null = null;
export let dragBoard: DragBoard | null = null;
export let dragOverBoard: string | null = null;
export let defaultColumns: Array<{ name: string; color: string }> = [
  { name: 'To Do', color: '#3B82F6' },
  { name: 'Doing', color: '#F59E0B' },
  { name: 'Done',  color: '#22C55E' },
];

export function setAppState(s: AppState): void  { appState = s; }
export function setSearchQuery(q: string): void  { searchQuery = q; }
export function setModal(m: Modal | null): void  { modal = m; }
export function setCtxMenu(m: CtxMenu | null): void { ctxMenu = m; }
export function setToast(t: Toast | null): void  { toast = t; }
export function setToastTimer(t: ReturnType<typeof setTimeout> | null): void { toastTimer = t; }
export function setPendingUndo(u: PendingUndo | null): void { pendingUndo = u; }
export function setDragCard(d: DragCard | null): void { dragCard = d; }
export function setDragOverCol(c: string | null): void { dragOverCol = c; }
export function setDragColumn(d: DragColumn | null): void { dragColumn = d; }
export function setDragOverColReorder(c: string | null): void { dragOverColReorder = c; }
export function setDragBoard(d: DragBoard | null): void { dragBoard = d; }
export function setDragOverBoard(id: string | null): void { dragOverBoard = id; }
export function setDefaultColumns(cols: Array<{ name: string; color: string }>): void { defaultColumns = cols; }

export function save(): void {
  vscode.postMessage({ type: 'save', data: appState });
}

export function currentBoard() {
  if (!appState.boards.length) return null;
  return appState.boards.find(b => b.id === appState.currentBoardId)
      || appState.boards[0];
}

export function cols() {
  return currentBoard()?.columns ?? [];
}

export function filtered(cards: AppState['boards'][0]['columns'][0]['cards']) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter(c =>
    c.title?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.tags?.some(t => t.toLowerCase().includes(q)) ||
    c.checklist?.some(i => i.text.toLowerCase().includes(q))
  );
}
