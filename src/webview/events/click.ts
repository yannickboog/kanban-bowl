// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, modal, ctxMenu, ctxActions, setModal, setSearchQuery, save, cols } from '../state.js';
import { render } from '../renderRef.js';
import { openBoardModal, submitBoard, closeBoard, dismissCtxMenu } from '../actions/board.js';
import { openColModal, submitCol, showColCtxMenu } from '../actions/column.js';
import { openCardModal, submitCard, deleteCard, snapshotCardForm, moveChecklistItem } from '../actions/card.js';
import { undoDelete } from '../actions/undo.js';
import { renderMarkdown } from '../markdown.js';

export function registerClickHandler(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = (e.target as Element).closest('[data-act]') as HTMLElement | null;

    if (ctxMenu && !(e.target as Element).closest('#ctx-menu')) {
      dismissCtxMenu();
      render();
      if (!target) return;
    }
    if (!target) return;
    e.stopPropagation();

    const act = target.dataset.act;
    switch (act) {
      case 'switch-board': {
        const id = target.dataset.board!;
        if (id !== appState.currentBoardId) {
          appState.currentBoardId = id;
          setSearchQuery('');
          save(); render();
        }
        break;
      }
      case 'add-board':   openBoardModal(null); break;
      case 'close-board': { e.stopPropagation(); closeBoard(target.dataset.board!); break; }

      case 'add-col':   openColModal(null); break;
      case 'toggle': {
        const col = cols().find(c => c.id === target.dataset.col);
        if (col) { col.collapsed = !col.collapsed; save(); render(); }
        break;
      }
      case 'col-menu': showColCtxMenu(e, target.dataset.col!); break;

      case 'add-card':  openCardModal(null, target.dataset.col!); break;
      case 'edit-card': {
        const col  = cols().find(c => c.id === target.dataset.col);
        const card = col?.cards.find(c => c.id === target.dataset.card);
        if (card) openCardModal(card, col!.id);
        break;
      }
      case 'del-card': deleteCard(target.dataset.card!, target.dataset.col!); break;

      case 'close-modal': setModal(null); render(); break;

      case 'pick-color':
        if (modal) {
          modal.newColor = target.dataset.color;
          document.querySelectorAll<HTMLElement>('.color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === modal!.newColor);
          });
        }
        break;

      case 'pick-card-color':
        if (modal) {
          modal.pendingCardColor = target.dataset.color;
          document.querySelectorAll<HTMLElement>('.card-color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === modal!.pendingCardColor);
          });
        }
        break;

      case 'rm-tag':
        if (modal?.pendingTags) {
          modal.pendingTags = modal.pendingTags.filter(t => t !== target.dataset.tag);
          snapshotCardForm();
          render();
          (document.getElementById('tag-field') as HTMLInputElement | null)?.focus();
        }
        break;

      case 'toggle-checklist': {
        const itemId = target.dataset.itemId!;
        const item   = modal?.pendingChecklist?.find(i => i.id === itemId);
        if (item) { item.done = !item.done; snapshotCardForm(); render(); }
        break;
      }

      case 'rm-checklist': {
        if (modal?.pendingChecklist) {
          modal.pendingChecklist = modal.pendingChecklist.filter(i => i.id !== target.dataset.itemId);
          snapshotCardForm();
          render();
          (document.getElementById('checklist-field') as HTMLInputElement | null)?.focus();
        }
        break;
      }

      case 'checklist-up':   moveChecklistItem(target.dataset.itemId!, 'up');   break;
      case 'checklist-down': moveChecklistItem(target.dataset.itemId!, 'down'); break;

      case 'desc-tab': {
        const tab      = target.dataset.tab!;
        const textarea = document.getElementById('card-desc') as HTMLTextAreaElement | null;
        const preview  = document.getElementById('desc-preview') as HTMLDivElement | null;
        const hint     = document.getElementById('desc-hint') as HTMLDivElement | null;
        if (!textarea || !preview) break;
        if (modal) modal.pendingDescTab = tab as 'edit' | 'preview';
        document.querySelectorAll<HTMLElement>('.desc-tab').forEach(t =>
          t.classList.toggle('active', t.dataset.tab === tab));
        if (tab === 'preview') {
          preview.innerHTML = renderMarkdown(textarea.value) || '<span style="color:var(--fg-3);font-style:italic">Nothing to preview.</span>';
          textarea.style.display = 'none';
          if (hint) hint.style.display = 'none';
          preview.style.display = 'block';
        } else {
          preview.style.display = 'none';
          if (hint) hint.style.display = '';
          textarea.style.display = '';
          textarea.focus();
        }
        break;
      }

      case 'submit-board': submitBoard(); break;
      case 'submit-col':   submitCol();   break;
      case 'submit-card':  submitCard();  break;

      case 'clear-search':
        setSearchQuery('');
        render();
        (document.getElementById('search') as HTMLInputElement | null)?.focus();
        break;

      case 'undo': undoDelete(); break;

      case 'ctx': {
        const fn = ctxActions[target.dataset.ctx!];
        dismissCtxMenu();
        if (fn) fn();
        break;
      }

    }
  });
}
