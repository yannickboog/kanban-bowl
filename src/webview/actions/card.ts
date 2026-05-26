// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, modal, ctxActions, setModal, setCtxMenu, setPendingUndo, save, currentBoard, cols } from '../state.js';
import { render } from '../renderRef.js';
import { uid } from '../uid.js';
import { esc } from '../esc.js';
import { showToast } from './toast.js';
import { undoDelete } from './undo.js';
import { dismissCtxMenu } from './board.js';
import type { Card, CtxMenuItem } from '../types.js';

export function openCardModal(card: Card | null, colId: string): void {
  setModal({
    kind: 'card',
    data: card ? { card, colId } : { colId },
    pendingTags:      card ? [...(card.tags      ?? [])] : [],
    pendingChecklist: card ? (card.checklist ?? []).map(i => ({ ...i })) : [],
    pendingCardColor: card?.color ?? 'none',
    pendingDescTab:   card?.description ? 'preview' : 'edit',
  });
  render();
  setTimeout(() => (document.getElementById('card-title') as HTMLInputElement | null)?.focus(), 0);
}

export function snapshotCardForm(): void {
  if (!modal) return;
  const t  = document.getElementById('card-title')      as HTMLInputElement | null;
  const d  = document.getElementById('card-desc')       as HTMLTextAreaElement | null;
  const p  = document.getElementById('card-prio')       as HTMLSelectElement | null;
  const c  = document.getElementById('card-col')        as HTMLSelectElement | null;
  const du = document.getElementById('card-due')        as HTMLInputElement | null;
  const tf = document.getElementById('tag-field')       as HTMLInputElement | null;
  const cf = document.getElementById('checklist-field') as HTMLInputElement | null;
  if (t)  modal.pendingTitle         = t.value;
  if (d)  modal.pendingDesc          = d.value;
  if (p)  modal.pendingPrio          = p.value;
  if (c)  modal.pendingColId         = c.value;
  if (du) modal.pendingDueDate       = du.value;
  if (tf) modal.pendingTagInput       = tf.value;
  if (cf) modal.pendingChecklistInput = cf.value;
}

function sanitizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/,/g, '').replace(/\s+/g, '-');
}

function allBoardTags(): string[] {
  const board = currentBoard();
  if (!board) return [];
  const set = new Set<string>();
  for (const col of board.columns)
    col.cards.forEach(card => card.tags?.forEach(t => set.add(t)));
  return [...set].sort();
}

export function pickTag(tag: string): void {
  if (!modal?.pendingTags || modal.pendingTags.includes(tag)) return;
  modal.pendingTags.push(tag);
  snapshotCardForm();
  modal.pendingTagInput = '';
  render();
  (document.getElementById('tag-field') as HTMLInputElement | null)?.focus();
}

export function onTagInput(): void {
  const input = document.getElementById('tag-field') as HTMLInputElement | null;
  const box   = document.getElementById('tag-suggestions');
  if (!input || !box) return;
  const val = sanitizeTag(input.value);
  if (!val) { box.innerHTML = ''; return; }
  const existing = modal?.pendingTags ?? [];
  const matches = allBoardTags()
    .filter(t => t.toLowerCase().startsWith(val.toLowerCase()) && !existing.includes(t))
    .slice(0, 6);
  box.innerHTML = matches.map(t => `<div class="tag-suggestion" data-tag="${esc(t)}">#${esc(t)}</div>`).join('');
}

export function onTagKey(e: KeyboardEvent): void {
  const input = e.target as HTMLInputElement;
  if (e.key === 'Tab') {
    const first = document.querySelector('.tag-suggestion') as HTMLElement | null;
    if (first) { e.preventDefault(); pickTag(first.dataset.tag!); }
    return;
  }
  if (e.key === 'Escape') {
    const box = document.getElementById('tag-suggestions');
    if (box) box.innerHTML = '';
    return;
  }
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = sanitizeTag(input.value);
    if (!val || !modal) return;
    if (!modal.pendingTags!.includes(val)) {
      modal.pendingTags!.push(val);
      snapshotCardForm();
      modal.pendingTagInput = '';
      render();
      (document.getElementById('tag-field') as HTMLInputElement | null)?.focus();
    } else {
      input.value = '';
      if (modal) modal.pendingTagInput = '';
      const box = document.getElementById('tag-suggestions');
      if (box) box.innerHTML = '';
    }
  } else if (e.key === 'Backspace' && input.value === '' && modal?.pendingTags?.length) {
    modal.pendingTags.pop();
    snapshotCardForm();
    render();
    (document.getElementById('tag-field') as HTMLInputElement | null)?.focus();
  }
}

export function submitCard(): void {
  const title   = (document.getElementById('card-title') as HTMLInputElement | null)?.value.trim() ?? '';
  const desc    = (document.getElementById('card-desc')  as HTMLTextAreaElement | null)?.value.trim() ?? '';
  const prio    = ((document.getElementById('card-prio') as HTMLSelectElement | null)?.value ?? 'none') as Card['priority'];
  const colId   = (document.getElementById('card-col')   as HTMLSelectElement | null)?.value ?? (modal?.data as { colId: string })?.colId;
  const dueDate = (document.getElementById('card-due')   as HTMLInputElement | null)?.value || undefined;

  let tags = [...(modal?.pendingTags ?? [])];
  const loose = sanitizeTag((document.getElementById('tag-field') as HTMLInputElement | null)?.value ?? '');
  if (loose) tags.push(loose);
  tags = [...new Set(tags)];

  const checklist = [...(modal?.pendingChecklist ?? [])];
  const looseChecklist = (document.getElementById('checklist-field') as HTMLInputElement | null)?.value.trim();
  if (looseChecklist) checklist.push({ id: uid(), text: looseChecklist, done: false });
  const color = modal?.pendingCardColor && modal.pendingCardColor !== 'none'
    ? modal.pendingCardColor : undefined;

  if (!title && !desc) { (document.getElementById('card-title') as HTMLInputElement | null)?.focus(); return; }

  const modalData = modal?.data as { card?: Card; colId: string } | null;
  const isEdit    = !!(modalData?.card);
  const origColId = modalData?.colId;
  const board     = currentBoard();
  if (!board) return;

  let msg: string;
  if (isEdit) {
    const srcCol = board.columns.find(c => c.id === origColId);
    const card   = srcCol?.cards.find(c => c.id === modalData!.card!.id);
    if (!card) { setModal(null); showToast('Card no longer exists', { isErr: true }); return; }
    if (colId !== origColId) {
      const dstCol = board.columns.find(c => c.id === colId);
      if (!dstCol) { setModal(null); showToast('Target column no longer exists', { isErr: true }); return; }
      Object.assign(card, { title, description: desc, priority: prio, tags, dueDate, color, checklist });
      srcCol!.cards.splice(srcCol!.cards.indexOf(card), 1);
      dstCol.cards.push(card);
    } else {
      Object.assign(card, { title, description: desc, priority: prio, tags, dueDate, color, checklist });
    }
    msg = 'Card updated';
  } else {
    const dstCol = board.columns.find(c => c.id === colId);
    if (!dstCol) { setModal(null); showToast('Target column no longer exists', { isErr: true }); return; }
    dstCol.cards.push({ id: uid(), title, description: desc, priority: prio, tags, dueDate, color, checklist, createdAt: new Date().toISOString() });
    msg = 'Card added';
  }

  setModal(null);
  save();
  showToast(msg);
}

export function deleteCard(cardId: string, colId: string): void {
  const board = currentBoard();
  const col   = board?.columns.find(c => c.id === colId);
  if (!col) return;
  const idx = col.cards.findIndex(c => c.id === cardId);
  if (idx === -1) return;
  const [card] = col.cards.splice(idx, 1);
  setPendingUndo({ type: 'card', card, colId, boardId: appState.currentBoardId ?? '', idx });
  save();
  showToast('Card deleted', { undo: undoDelete });
}

export function togglePinCard(cardId: string, colId: string): void {
  const col  = cols().find(c => c.id === colId);
  const card = col?.cards.find(c => c.id === cardId);
  if (!card) return;
  card.pinned = !card.pinned;
  save(); render();
  showToast(card.pinned ? 'Card pinned' : 'Card unpinned');
}

export function moveChecklistItem(itemId: string, dir: 'up' | 'down'): void {
  if (!modal?.pendingChecklist) return;
  const items = modal.pendingChecklist;
  const idx   = items.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;
  [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
  snapshotCardForm();
  render();
  (document.getElementById('checklist-field') as HTMLInputElement | null)?.focus();
}

export function onChecklistKey(e: KeyboardEvent): void {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const input = e.target as HTMLInputElement;
  const val   = input.value.trim();
  if (!val || !modal) return;
  if (!modal.pendingChecklist) modal.pendingChecklist = [];
  modal.pendingChecklist.push({ id: uid(), text: val, done: false });
  snapshotCardForm();
  modal.pendingChecklistInput = '';
  render();
  (document.getElementById('checklist-field') as HTMLInputElement | null)?.focus();
}

export function showCardCtxMenu(e: MouseEvent, cardId: string, colId: string): void {
  dismissCtxMenu();
  const editId   = uid();
  const pinId    = uid();
  const cloneId  = uid();
  const delId    = uid();
  const isPinned = !!cols().find(c => c.id === colId)?.cards.find(c => c.id === cardId)?.pinned;
  ctxActions[editId] = () => {
    const col  = cols().find(c => c.id === colId);
    const card = col?.cards.find(c => c.id === cardId);
    if (card) openCardModal(card, colId);
  };
  ctxActions[pinId] = () => togglePinCard(cardId, colId);
  ctxActions[cloneId] = () => {
    const col  = cols().find(c => c.id === colId);
    const card = col?.cards.find(c => c.id === cardId);
    if (!col || !card) return;
    const clone = { ...card, id: uid(), createdAt: new Date().toISOString(), tags: [...(card.tags ?? [])], checklist: (card.checklist ?? []).map(i => ({ ...i })) };
    const idx = col.cards.indexOf(card);
    col.cards.splice(idx + 1, 0, clone);
    setPendingUndo({ type: 'clone', cardId: clone.id, colId, boardId: appState.currentBoardId ?? '' });
    save();
    showToast('Card cloned', { undo: undoDelete });
  };
  ctxActions[delId] = () => deleteCard(cardId, colId);
  const items: CtxMenuItem[] = [
    { id: editId,  label: 'Edit Card' },
    { id: pinId,   label: isPinned ? 'Unpin Card' : 'Pin Card' },
    { id: cloneId, label: 'Clone Card' },
    { sep: true },
    { id: delId,   label: 'Delete Card', dest: true },
  ];
  setCtxMenu({ x: e.clientX, y: e.clientY, itemIds: [editId, pinId, cloneId, delId], items });
  render();
}
