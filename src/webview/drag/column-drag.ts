// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { dragColumn, dragOverColReorder, setDragColumn, setDragOverColReorder, save, currentBoard } from '../state.js';
import { render } from '../renderRef.js';

export function onColDragStart(e: DragEvent): void {
  const handle = (e.target as Element).closest('.col-drag-handle') as HTMLElement | null;
  const colId  = handle?.dataset.col;
  if (!colId) return;
  setDragColumn({ colId });
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', colId);
  e.stopPropagation();
}

export function onColDragEnd(): void {
  setDragColumn(null);
  setDragOverColReorder(null);
  document.querySelectorAll('.column.col-reorder-over').forEach(c => c.classList.remove('col-reorder-over'));
}

export function onColDragOver(e: DragEvent): void {
  if (!dragColumn) return;
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  const col   = (e.target as Element).closest('.column') as HTMLElement | null;
  const colId = col?.dataset.col;
  if (colId && colId !== dragColumn.colId && dragOverColReorder !== colId) {
    setDragOverColReorder(colId);
    document.querySelectorAll<HTMLElement>('.column').forEach(el => {
      el.classList.toggle('col-reorder-over', el.dataset.col === colId);
    });
  }
}

export function onColDrop(e: DragEvent): void {
  if (!dragColumn) return;
  e.preventDefault();
  const targetCol = (e.target as Element).closest('.column') as HTMLElement | null;
  if (!targetCol) return;
  const toColId   = targetCol.dataset.col!;
  const fromColId = dragColumn.colId;
  if (toColId === fromColId) return;

  const board = currentBoard();
  if (!board) return;
  const columns  = board.columns;
  const fromIdx = columns.findIndex(c => c.id === fromColId);
  const toIdx   = columns.findIndex(c => c.id === toColId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = columns.splice(fromIdx, 1);
  columns.splice(toIdx, 0, moved);

  setDragColumn(null); setDragOverColReorder(null);
  save(); render();
}
