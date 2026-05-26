// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, modal, ctxMenu, ctxActions, setModal, setCtxMenu, setSearchQuery, setPendingUndo, save, defaultColumns } from '../state.js';
import { render } from '../renderRef.js';
import { uid } from '../uid.js';
import { showToast } from './toast.js';
import { undoDelete } from './undo.js';
import type { Board, CtxMenuItem } from '../types.js';

export function openBoardModal(board: Board | null): void {
  setModal({ kind: 'board', data: board ? { ...board } : null });
  render();
  setTimeout(() => (document.getElementById('board-name') as HTMLInputElement | null)?.focus(), 0);
}

export function submitBoard(): void {
  const el   = document.getElementById('board-name') as HTMLInputElement | null;
  const name = el?.value.trim();
  if (!name) { el?.focus(); return; }

  const data = (modal?.data as { id: string; name: string } | null) ?? null;
  let msg: string;
  if (data) {
    const board = appState.boards.find(b => b.id === data.id);
    if (!board) { setModal(null); showToast('Board no longer exists', { isErr: true }); return; }
    board.name = name;
    msg = `Board renamed to "${name}"`;
  } else {
    const newBoard: Board = {
      id: uid(), name,
      columns: defaultColumns.map(c => ({
        id: uid(), name: c.name || 'Column', color: c.color || '#6B7280', cards: [], collapsed: false,
      })),
    };
    appState.boards.push(newBoard);
    appState.currentBoardId = newBoard.id;
    msg = `Board "${name}" created`;
  }
  setModal(null);
  save();
  showToast(msg);
}

export function closeBoard(boardId: string): void {
  if (appState.boards.length === 1) { showToast('Cannot delete the last board', { isErr: true }); return; }
  const idx = appState.boards.findIndex(b => b.id === boardId);
  if (idx === -1) return;
  const [removed] = appState.boards.splice(idx, 1);
  if (appState.currentBoardId === boardId) {
    appState.currentBoardId = (appState.boards[idx] ?? appState.boards[idx - 1]).id;
    setSearchQuery('');
  }
  setPendingUndo({ type: 'board', board: removed, idx });
  save();
  showToast(`Board "${removed.name}" deleted`, { undo: undoDelete });
}

export function showBoardTabCtxMenu(e: MouseEvent, boardId: string): void {
  dismissCtxMenu();
  const board = appState.boards.find(b => b.id === boardId);
  if (!board) return;
  const renameId = uid();
  ctxActions[renameId] = () => {
    const board = appState.boards.find(b => b.id === boardId);
    if (!board) return;
    openBoardModal(board);
  };
  const itemIds = [renameId];
  const items: CtxMenuItem[] = [{ id: renameId, label: 'Rename Board' }];
  if (appState.boards.length > 1) {
    const deleteId = uid();
    ctxActions[deleteId] = () => closeBoard(boardId);
    itemIds.push(deleteId);
    items.push({ sep: true }, { id: deleteId, label: 'Delete Board', dest: true });
  }
  setCtxMenu({ x: e.clientX, y: e.clientY, itemIds, items });
  render();
}

export function dismissCtxMenu(): void {
  if (!ctxMenu) return;
  (ctxMenu.itemIds ?? []).forEach(id => delete ctxActions[id]);
  setCtxMenu(null);
}

