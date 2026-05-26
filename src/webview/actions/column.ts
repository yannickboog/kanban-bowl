// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, modal, ctxActions, setModal, setCtxMenu, setPendingUndo, save, currentBoard, cols } from '../state.js';
import { render } from '../renderRef.js';
import { uid } from '../uid.js';
import { showToast } from './toast.js';
import { undoDelete } from './undo.js';
import { dismissCtxMenu } from './board.js';
import { COLORS } from '../colors.js';
import type { Column, ColSort, CtxMenuItem } from '../types.js';

export function openColModal(col: Column | null): void {
  setModal({ kind: 'column', data: col ? { ...col } : null, newColor: col?.color ?? COLORS[0].v });
  render();
  setTimeout(() => (document.getElementById('col-name') as HTMLInputElement | null)?.focus(), 0);
}

export function submitCol(): void {
  const nameEl = document.getElementById('col-name') as HTMLInputElement | null;
  const name   = nameEl?.value.trim();
  if (!name) { nameEl?.focus(); return; }
  const color = (document.querySelector('.color-swatch.active') as HTMLElement | null)?.dataset.color
              ?? modal?.newColor ?? COLORS[0].v;

  const board = currentBoard();
  if (!board) return;

  const wipRaw = parseInt((document.getElementById('col-wip') as HTMLInputElement | null)?.value ?? '', 10);
  const wipLimit = !isNaN(wipRaw) && wipRaw >= 1 ? wipRaw : undefined;

  const data = modal?.data as { id: string; name: string; color: string; wipLimit?: number; sort?: ColSort } | null;
  let msg: string;
  if (data) {
    const col = board.columns.find(c => c.id === data.id);
    if (!col) { setModal(null); showToast('Column no longer exists', { isErr: true }); return; }
    col.name = name; col.color = color; col.wipLimit = wipLimit;
    msg = `Column "${name}" updated`;
  } else {
    board.columns.push({ id: uid(), name, color, cards: [], collapsed: false, wipLimit });
    msg = `Column "${name}" added`;
  }
  setModal(null);
  save();
  showToast(msg);
}

export function showColCtxMenu(e: MouseEvent, colId: string): void {
  dismissCtxMenu();
  if (!cols().find(c => c.id === colId)) return;

  const editId  = uid();
  const clearId = uid();
  const delId   = uid();
  const sortIds: Record<ColSort, string> = { priority: uid(), due: uid(), created: uid(), title: uid() };

  ctxActions[editId] = () => {
    const col = cols().find(c => c.id === colId);
    if (!col) return;
    openColModal(col);
  };
  ctxActions[clearId] = () => {
    const col = cols().find(c => c.id === colId);
    if (!col || !col.cards.length) { dismissCtxMenu(); render(); return; }
    const saved = [...col.cards];
    col.cards = [];
    setPendingUndo({ type: 'clear', cards: saved, colId, boardId: appState.currentBoardId ?? '' });
    save();
    showToast(`Cleared "${col.name}"`, { undo: undoDelete });
  };
  ctxActions[delId] = () => {
    const board = currentBoard();
    if (!board) return;
    const idx = board.columns.findIndex(c => c.id === colId);
    if (idx === -1) return;
    const [removed] = board.columns.splice(idx, 1);
    setPendingUndo({ type: 'column', col: removed, boardId: appState.currentBoardId ?? '', idx });
    save();
    showToast(`Column "${removed.name}" deleted`, { undo: undoDelete });
  };

  const sortLabels: Record<ColSort, string> = { priority: 'Priority', due: 'Due Date', created: 'Created', title: 'Title' };
  const currentSort = cols().find(c => c.id === colId)?.sort;
  (Object.keys(sortIds) as ColSort[]).forEach(key => {
    ctxActions[sortIds[key]] = () => {
      const col = cols().find(c => c.id === colId);
      if (!col) return;
      col.sort = col.sort === key ? undefined : key;
      save(); render();
    };
  });

  const items: CtxMenuItem[] = [
    { id: editId,  label: 'Edit Column' },
    { id: clearId, label: 'Clear All Cards' },
    { sep: true },
    ...(Object.keys(sortIds) as ColSort[]).map(key => ({
      id: sortIds[key],
      label: `${currentSort === key ? '✓ ' : ''}Sort: ${sortLabels[key]}`,
    })),
    { sep: true },
    { id: delId, label: 'Delete Column', dest: true },
  ];
  setCtxMenu({ x: e.clientX, y: e.clientY, itemIds: [editId, clearId, ...Object.values(sortIds), delId], items });
  render();
}
