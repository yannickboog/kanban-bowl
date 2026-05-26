// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { modal, ctxMenu, setModal, searchQuery, setSearchQuery, cols } from '../state.js';
import { render } from '../renderRef.js';
import { dismissCtxMenu, submitBoard } from '../actions/board.js';
import { submitCol } from '../actions/column.js';
import { submitCard, openCardModal } from '../actions/card.js';

export function registerKeyboardHandler(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (modal)       { setModal(null);      render(); return; }
      if (ctxMenu)     { dismissCtxMenu();    render(); return; }
      if (searchQuery) { setSearchQuery(''); render(); return; }
    }

    if (e.key === 'Enter' && modal && !e.defaultPrevented) {
      const tag = (e.target as Element).tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
      e.preventDefault();
      if (modal.kind === 'board')  { submitBoard(); return; }
      if (modal.kind === 'column') { submitCol();   return; }
      if (modal.kind === 'card')   { submitCard();  return; }
    }

    if (e.key === 'n' && !modal && !ctxMenu) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const firstCol = cols().find(c => !c.collapsed);
      if (!firstCol) return;
      e.preventDefault();
      openCardModal(null, firstCol.id);
    }
  });
}
