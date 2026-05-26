// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { ctxMenu, toast } from '../state.js';
import { esc } from '../esc.js';
import { I } from '../icons.js';
import { CTX_MENU_MARGIN_X, CTX_MENU_MARGIN_Y } from '../constants.js';

export function renderCtxMenu(): string {
  if (!ctxMenu) return '';
  const x = Math.min(ctxMenu.x, window.innerWidth  - CTX_MENU_MARGIN_X);
  const y = Math.min(ctxMenu.y, window.innerHeight - CTX_MENU_MARGIN_Y);
  return `
    <div class="ctx-menu" id="ctx-menu" style="left:${x}px;top:${y}px">
      ${ctxMenu.items.map(item => {
        if (item.sep) return `<div class="ctx-sep"></div>`;
        return `<div class="ctx-item${item.dest ? ' destructive' : ''}"
                     data-act="ctx" data-ctx="${item.id}">${esc(item.label ?? '')}</div>`;
      }).join('')}
    </div>`;
}

export function renderToast(): string {
  if (!toast) return '';
  return `
    <div class="toast">
      <span class="toast-icon ${toast.isErr ? 'err' : 'ok'}">${toast.isErr ? I.warning : I.check}</span>
      <span>${esc(toast.msg)}</span>
      ${toast.undo ? `<button class="toast-undo" data-act="undo">Undo</button>` : ''}
    </div>`;
}
