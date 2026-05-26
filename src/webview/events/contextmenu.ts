// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { showBoardTabCtxMenu } from '../actions/board.js';
import { showCardCtxMenu } from '../actions/card.js';

export function registerContextMenuHandler(): void {
  document.addEventListener('contextmenu', (e: MouseEvent) => {
    const tab = (e.target as Element).closest('.board-tab') as HTMLElement | null;
    if (tab) {
      if ((e.target as Element).closest('.board-tab-close')) return;
      e.preventDefault();
      showBoardTabCtxMenu(e, tab.dataset.board!);
      return;
    }
    const card = (e.target as Element).closest('.card') as HTMLElement | null;
    if (!card) return;
    e.preventDefault();
    showCardCtxMenu(e, card.dataset.card!, card.dataset.col!);
  });
}
