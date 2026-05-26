// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, pendingUndo, toastTimer, save, setPendingUndo, setToast, setToastTimer, setSearchQuery } from '../state.js';
import { render } from '../renderRef.js';
import { showToast } from './toast.js';

export function undoDelete(): void {
  if (!pendingUndo) return;
  const { type } = pendingUndo;

  const clearTimer = (): void => {
    if (toastTimer) { clearTimeout(toastTimer); setToastTimer(null); }
  };
  const fail = (msg: string): void => {
    setPendingUndo(null); clearTimer(); setToast(null);
    showToast(msg, { isErr: true });
  };
  const navToBoard = (boardId: string): void => {
    if (appState.currentBoardId !== boardId) { appState.currentBoardId = boardId; setSearchQuery(''); }
  };

  if (type === 'card') {
    const { card, colId, boardId, idx } = pendingUndo;
    const board = appState.boards.find(b => b.id === boardId);
    const col   = board?.columns.find(c => c.id === colId);
    if (!col) { fail('Could not restore card — column was deleted'); return; }
    navToBoard(boardId);
    col.cards.splice(idx, 0, card);

  } else if (type === 'clear') {
    const { cards, colId, boardId } = pendingUndo;
    const board = appState.boards.find(b => b.id === boardId);
    const col   = board?.columns.find(c => c.id === colId);
    if (!col) { fail('Could not restore cards — column was deleted'); return; }
    navToBoard(boardId);
    col.cards = cards;

  } else if (type === 'column') {
    const { col, boardId, idx } = pendingUndo;
    const board = appState.boards.find(b => b.id === boardId);
    if (!board) { fail('Could not restore column — board was deleted'); return; }
    navToBoard(boardId);
    board.columns.splice(idx, 0, col);

  } else if (type === 'clone') {
    const { cardId, boardId } = pendingUndo;
    const board = appState.boards.find(b => b.id === boardId);
    if (!board) { fail('Could not undo clone — board was deleted'); return; }
    let found = false;
    for (const col of board.columns) {
      const idx = col.cards.findIndex(c => c.id === cardId);
      if (idx !== -1) { col.cards.splice(idx, 1); found = true; break; }
    }
    if (!found) { fail('Could not undo clone — card not found'); return; }

  } else if (type === 'board') {
    const { board: removedBoard, idx } = pendingUndo;
    appState.boards.splice(idx, 0, removedBoard);
    appState.currentBoardId = removedBoard.id;
    setSearchQuery('');
  }

  setPendingUndo(null);
  clearTimer();
  setToast(null);
  save();
  render();
}
