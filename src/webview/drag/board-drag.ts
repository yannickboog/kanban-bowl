// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, dragBoard, dragOverBoard, setDragBoard, setDragOverBoard, save } from '../state.js';
import { render } from '../renderRef.js';

export function onBoardDragStart(e: DragEvent): void {
  if ((e.target as Element).closest('button')) { e.preventDefault(); return; }
  const tab = (e.target as Element).closest('.board-tab') as HTMLElement | null;
  if (!tab) return;
  setDragBoard({ boardId: tab.dataset.board! });
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', tab.dataset.board!);
}

export function onBoardDragEnd(): void {
  setDragBoard(null);
  setDragOverBoard(null);
  document.querySelectorAll('.board-tab.tab-drag-over').forEach(t => t.classList.remove('tab-drag-over'));
}

export function onBoardDragOver(e: DragEvent): void {
  if (!dragBoard) return;
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  const tab   = (e.target as Element).closest('.board-tab') as HTMLElement | null;
  const tabId = tab?.dataset.board;
  if (tabId && tabId !== dragBoard.boardId && dragOverBoard !== tabId) {
    setDragOverBoard(tabId);
    document.querySelectorAll<HTMLElement>('.board-tab').forEach(el => {
      el.classList.toggle('tab-drag-over', el.dataset.board === tabId);
    });
  }
}

export function onBoardDrop(e: DragEvent): void {
  if (!dragBoard) return;
  e.preventDefault();
  const tab = (e.target as Element).closest('.board-tab') as HTMLElement | null;
  if (!tab) return;
  const toId   = tab.dataset.board!;
  const fromId = dragBoard.boardId;
  if (toId === fromId) return;

  const boards  = appState.boards;
  const fromIdx = boards.findIndex(b => b.id === fromId);
  const toIdx   = boards.findIndex(b => b.id === toId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = boards.splice(fromIdx, 1);
  boards.splice(toIdx, 0, moved);

  setDragBoard(null); setDragOverBoard(null);
  save(); render();
}
