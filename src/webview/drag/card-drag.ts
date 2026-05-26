// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { dragCard, dragOverCol, setDragCard, setDragOverCol, save, currentBoard } from '../state.js';
import { render } from '../renderRef.js';

export function onCardDragStart(e: DragEvent): void {
  const btn = (e.target as Element).closest('button');
  if (btn) { e.preventDefault(); return; }
  const el = (e.target as Element).closest('.card') as HTMLElement | null;
  if (!el) return;
  setDragCard({ cardId: el.dataset.card!, fromColId: el.dataset.col! });
  el.classList.add('dragging');
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', el.dataset.card!);
}

export function onCardDragEnd(e: DragEvent): void {
  (e.target as Element).classList.remove('dragging');
  setDragCard(null);
  setDragOverCol(null);
  document.querySelectorAll('.column.drag-over').forEach(c => c.classList.remove('drag-over'));
}

export function onCardDragOver(e: DragEvent): void {
  if (!dragCard) return;
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  const body  = (e.target as Element).closest('.col-body') as HTMLElement | null;
  const colId = body?.dataset.col;
  if (colId && dragOverCol !== colId) {
    setDragOverCol(colId);
    document.querySelectorAll<HTMLElement>('.column').forEach(el => {
      el.classList.toggle('drag-over', el.dataset.col === colId);
    });
  }
}

export function onCardDragLeave(e: DragEvent): void {
  const col = (e.target as Element).closest('.column') as HTMLElement | null;
  if (col && !col.contains(e.relatedTarget as Node)) {
    col.classList.remove('drag-over');
    if (dragOverCol === col.dataset.col) setDragOverCol(null);
  }
}

export function onCardDrop(e: DragEvent): void {
  e.preventDefault();
  const body = (e.target as Element).closest('.col-body') as HTMLElement | null;
  if (!body || !dragCard) return;

  const toColId               = body.dataset.col!;
  const { cardId, fromColId } = dragCard;
  const board                 = currentBoard();
  if (!board) return;

  const srcCol = board.columns.find(c => c.id === fromColId);
  const dstCol = board.columns.find(c => c.id === toColId);
  if (!srcCol || !dstCol) return;

  const fromIdx = srcCol.cards.findIndex(c => c.id === cardId);
  if (fromIdx === -1) return;
  const [card] = srcCol.cards.splice(fromIdx, 1);

  const dropTarget = (e.target as Element).closest('.card') as HTMLElement | null;
  if (dropTarget && dropTarget.dataset.card !== cardId) {
    const toIdx = dstCol.cards.findIndex(c => c.id === dropTarget.dataset.card);
    dstCol.cards.splice(toIdx >= 0 ? toIdx : dstCol.cards.length, 0, card);
  } else if (!dropTarget || dropTarget.dataset.card !== cardId) {
    dstCol.cards.push(card);
  } else {
    srcCol.cards.splice(fromIdx, 0, card);
    setDragCard(null); setDragOverCol(null);
    return;
  }

  setDragCard(null); setDragOverCol(null);
  save(); render();
}
