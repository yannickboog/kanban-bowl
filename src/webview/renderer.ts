// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { modal, ctxMenu, toast } from './state.js';
import { renderBoardTabs } from './render/tabs.js';
import { renderBoardArea } from './render/board.js';
import { renderModal } from './render/modals.js';
import { renderCtxMenu, renderToast } from './render/overlay.js';
import { wireBoard, wireTabs, wireOverlay } from './render/wire.js';

let _tabs    = '';
let _board   = '';
let _overlay = '';
let _ctx     = '';
let _toast   = '';
let _initialized = false;

function setZone(id: string, html: string): void {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

export function render(): void {
  if (!_initialized) {
    document.getElementById('app')!.innerHTML = `
      <div id="zone-tabs"></div>
      <div id="zone-board"></div>
      <div id="zone-overlay"></div>
      <div id="zone-ctx"></div>
      <div id="zone-toast"></div>
    `;
    _initialized = true;
    _tabs = _board = _overlay = _ctx = _toast = '';
  }

  const tabs      = renderBoardTabs();
  const board     = renderBoardArea();
  const overlay   = modal   ? renderModal()   : '';
  const ctx       = ctxMenu ? renderCtxMenu() : '';
  const toastHtml = toast   ? renderToast()   : '';

  if (tabs !== _tabs)         { setZone('zone-tabs',    tabs);      _tabs    = tabs;      wireTabs(); }
  if (board !== _board)       { setZone('zone-board',   board);     _board   = board;     wireBoard(); }
  if (overlay !== _overlay)   { setZone('zone-overlay', overlay);   _overlay = overlay;   wireOverlay(); }
  if (ctx !== _ctx)           { setZone('zone-ctx',     ctx);       _ctx     = ctx; }
  if (toastHtml !== _toast)   { setZone('zone-toast',   toastHtml); _toast   = toastHtml; }
}
