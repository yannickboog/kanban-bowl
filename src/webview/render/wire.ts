// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { setSearchQuery, setModal } from '../state.js';
import { render } from '../renderRef.js';
import { onTagKey, onTagInput, onChecklistKey, pickTag } from '../actions/card.js';
import { onCardDragStart, onCardDragEnd, onCardDragOver, onCardDragLeave, onCardDrop } from '../drag/card-drag.js';
import { onColDragStart, onColDragEnd, onColDragOver, onColDrop } from '../drag/column-drag.js';
import { onBoardDragStart, onBoardDragEnd, onBoardDragOver, onBoardDrop } from '../drag/board-drag.js';

let _modalDx = 0;
let _modalDy = 0;

export function wireTabs(): void {
  const si = document.getElementById('search') as HTMLInputElement | null;
  if (si) {
    si.addEventListener('input', (e: Event) => {
      if ((e as InputEvent).isComposing) return;
      const input = e.target as HTMLInputElement;
      const cur   = input.selectionStart ?? 0;
      setSearchQuery(input.value);
      render();
      const s2 = document.getElementById('search') as HTMLInputElement | null;
      if (s2) { s2.focus(); s2.setSelectionRange(cur, cur); }
    });
  }

  document.querySelectorAll<HTMLElement>('.board-tab').forEach(el => {
    el.addEventListener('dragstart', onBoardDragStart as EventListener);
    el.addEventListener('dragend',   onBoardDragEnd   as EventListener);
    el.addEventListener('dragover',  onBoardDragOver  as EventListener);
    el.addEventListener('drop',      onBoardDrop      as EventListener);
  });
}

export function wireOverlay(): void {
  const overlay = document.getElementById('overlay');
  if (!overlay) { _modalDx = 0; _modalDy = 0; return; }

  overlay.addEventListener('click', (e: Event) => {
    if ((e.target as Element).id === 'overlay') {
      _modalDx = 0; _modalDy = 0;
      setModal(null); render();
    }
  });

  const head    = document.querySelector('.modal-head') as HTMLElement | null;
  const modalEl = document.querySelector('.modal')      as HTMLElement | null;
  if (head && modalEl) {
    if (_modalDx !== 0 || _modalDy !== 0) {
      modalEl.style.transform = `translate(${_modalDx}px,${_modalDy}px)`;
      modalEl.dataset.dx = String(_modalDx);
      modalEl.dataset.dy = String(_modalDy);
    }
    head.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.target as Element).closest('button')) return;
      e.preventDefault();
      const dx0 = parseFloat(modalEl.dataset.dx ?? '0');
      const dy0 = parseFloat(modalEl.dataset.dy ?? '0');
      const x0  = e.clientX;
      const y0  = e.clientY;
      const onMove = (ev: MouseEvent): void => {
        const dx = dx0 + ev.clientX - x0;
        const dy = dy0 + ev.clientY - y0;
        modalEl.style.transform = `translate(${dx}px,${dy}px)`;
        modalEl.dataset.dx = String(dx);
        modalEl.dataset.dy = String(dy);
        _modalDx = dx;
        _modalDy = dy;
      };
      const onUp = (): void => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  const tf = document.getElementById('tag-field') as HTMLInputElement | null;
  if (tf) {
    tf.addEventListener('keydown', onTagKey as EventListener);
    tf.addEventListener('input', onTagInput);
    document.getElementById('tags-wrap')?.addEventListener('click', e => {
      const sug = (e.target as Element).closest('.tag-suggestion') as HTMLElement | null;
      if (sug) { pickTag(sug.dataset.tag!); return; }
      tf.focus();
    });
  }

  const cf = document.getElementById('checklist-field') as HTMLInputElement | null;
  if (cf) cf.addEventListener('keydown', onChecklistKey as EventListener);
}

export function wireBoard(): void {
  document.querySelectorAll<HTMLElement>('.card[draggable]').forEach(el => {
    el.addEventListener('dragstart', onCardDragStart as EventListener);
    el.addEventListener('dragend',   onCardDragEnd   as EventListener);
  });
  document.querySelectorAll<HTMLElement>('.col-body').forEach(el => {
    el.addEventListener('dragover',  onCardDragOver  as EventListener);
    el.addEventListener('drop',      onCardDrop      as EventListener);
    el.addEventListener('dragleave', onCardDragLeave as EventListener);
  });
  document.querySelectorAll<HTMLElement>('.col-drag-handle').forEach(el => {
    el.addEventListener('dragstart', onColDragStart as EventListener);
    el.addEventListener('dragend',   onColDragEnd   as EventListener);
  });
  document.querySelectorAll<HTMLElement>('.column').forEach(el => {
    el.addEventListener('dragover', onColDragOver as EventListener);
    el.addEventListener('drop',     onColDrop     as EventListener);
  });
}
