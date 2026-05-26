// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0


import { setAppState, setDefaultColumns, vscode, appState, modal, save, setModal, setPendingUndo, setToast, toastTimer, setToastTimer } from './state.js';
import { setRenderFn } from './renderRef.js';
import { render } from './renderer.js';
import { registerClickHandler } from './events/click.js';
import { registerKeyboardHandler } from './events/keyboard.js';
import { registerContextMenuHandler } from './events/contextmenu.js';
import { openCardModal, snapshotCardForm } from './actions/card.js';
import type { AppState } from './types.js';

setRenderFn(render);

registerClickHandler();
registerKeyboardHandler();
registerContextMenuHandler();

window.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as { type: string; data?: AppState; cardId?: string; colId?: string; defaultColumns?: Array<{ name: string; color: string }>; reset?: boolean };
  if (msg.type === 'load' && msg.data) {
    if (modal?.kind === 'card') snapshotCardForm();
    if (msg.reset) {
      if (toastTimer) { clearTimeout(toastTimer); setToastTimer(null); }
      setPendingUndo(null);
      setToast(null);
      setModal(null);
    }
    setAppState(msg.data);
    render();
  } else if (msg.type === 'config' && msg.defaultColumns) {
    setDefaultColumns(msg.defaultColumns);
  } else if (msg.type === 'openCard' && msg.cardId) {
    for (const board of appState.boards) {
      for (const col of board.columns) {
        const card = col.cards.find(c => c.id === msg.cardId);
        if (card) {
          if (appState.currentBoardId !== board.id) {
            appState.currentBoardId = board.id;
            save();
          }
          openCardModal(card, col.id);
          return;
        }
      }
    }
  }
});

render();
vscode.postMessage({ type: 'ready' });
