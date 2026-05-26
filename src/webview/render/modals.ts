// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { modal, cols } from '../state.js';
import { esc } from '../esc.js';
import { I } from '../icons.js';
import { COLORS, CARD_COLORS } from '../colors.js';
import { BOARD_NAME_MAX_LENGTH, COL_NAME_MAX_LENGTH, CARD_TITLE_MAX_LENGTH, CARD_DESC_MAX_LENGTH, TAG_MAX_LENGTH, CHECKLIST_ITEM_MAX_LENGTH } from '../constants.js';
import { renderMarkdown } from '../markdown.js';
import type { Card } from '../types.js';

export function renderModal(): string {
  if (!modal) return '';
  switch (modal.kind) {
    case 'board':  return renderBoardModal();
    case 'column': return renderColumnModal();
    case 'card':   return renderCardModal();
  }
}

function renderBoardModal(): string {
  const data = modal!.data as { id: string; name: string } | null;
  const isEdit = !!data;
  return `
    <div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">${isEdit ? 'Rename Board' : 'New Board'}</span>
          <button class="modal-close" data-act="close-modal">${I.close}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="board-name" type="text"
                   value="${esc(data?.name ?? '')}"
                   placeholder="Board name" maxlength="${BOARD_NAME_MAX_LENGTH}" autocomplete="off"/>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" data-act="close-modal">Cancel</button>
          <button class="btn btn-primary" data-act="submit-board">
            ${isEdit ? 'Save' : 'Create Board'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderColumnModal(): string {
  const { data, newColor } = modal!;
  const colData = data as { id: string; name: string; color: string; wipLimit?: number } | null;
  const isEdit  = !!colData;
  const color   = newColor ?? colData?.color ?? COLORS[0].v;
  const wipVal  = colData?.wipLimit ?? '';

  return `
    <div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">${isEdit ? 'Edit Column' : 'New Column'}</span>
          <button class="modal-close" data-act="close-modal">${I.close}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="col-name" type="text"
                   value="${esc(colData?.name ?? '')}"
                   placeholder="Column name" maxlength="${COL_NAME_MAX_LENGTH}" autocomplete="off"/>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-row">
              ${COLORS.map(c => `
                <div class="color-swatch${c.v === color ? ' active' : ''}"
                     style="background:${esc(c.v)}"
                     data-act="pick-color" data-color="${c.v}"
                     title="${c.name}"></div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">WIP Limit <span style="font-weight:400;color:var(--fg-3)">optional</span></label>
            <input class="form-input" id="col-wip" type="number" min="1" max="999"
                   value="${wipVal}" placeholder="e.g. 5" autocomplete="off" style="width:100px"/>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" data-act="close-modal">Cancel</button>
          <button class="btn btn-primary" data-act="submit-col">
            ${isEdit ? 'Save' : 'Add Column'}
          </button>
        </div>
      </div>
    </div>`;
}

function renderCardModal(): string {
  const { data, pendingTags, pendingTitle, pendingDesc, pendingPrio, pendingColId, pendingDueDate, pendingCardColor, pendingChecklist, pendingDescTab, pendingTagInput, pendingChecklistInput } = modal!;
  const cardData = data as { card?: Card; colId: string } | null;
  const isEdit   = !!(cardData?.card);
  const card     = isEdit ? cardData!.card! : null;
  const colId    = pendingColId   ?? cardData?.colId;
  const prio     = pendingPrio    ?? card?.priority ?? 'none';
  const tags      = pendingTags      ?? [];
  const checklist = pendingChecklist ?? [];
  const cardColor = pendingCardColor ?? 'none';
  const titleVal = pendingTitle   ?? card?.title       ?? '';
  const descVal  = pendingDesc    ?? card?.description ?? '';
  const dueVal   = pendingDueDate ?? card?.dueDate     ?? '';
  const descTab  = pendingDescTab ?? (descVal ? 'preview' : 'edit');

  const colOpts = cols().map(c =>
    `<option value="${esc(c.id)}"${c.id === colId ? ' selected' : ''}>${esc(c.name)}</option>`
  ).join('');

  return `
    <div class="overlay" id="overlay">
      <div class="modal modal-card">
        <div class="modal-head">
          <span class="modal-title">${isEdit ? 'Edit Card' : 'New Card'}</span>
          <button class="modal-close" data-act="close-modal">${I.close}</button>
        </div>
        <div class="modal-card-layout">
          <div class="modal-card-main">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="card-title" type="text"
                     value="${esc(titleVal)}"
                     placeholder="Card title" maxlength="${CARD_TITLE_MAX_LENGTH}" autocomplete="off"/>
            </div>
            <div class="form-group">
              <div class="desc-tab-bar">
                <label class="form-label">Description</label>
                <div class="desc-tabs">
                  <button class="desc-tab${descTab === 'edit' ? ' active' : ''}" data-act="desc-tab" data-tab="edit">Edit</button>
                  <button class="desc-tab${descTab === 'preview' ? ' active' : ''}" data-act="desc-tab" data-tab="preview">Preview</button>
                </div>
              </div>
              <textarea class="form-textarea form-textarea-card" id="card-desc" placeholder="Description…" maxlength="${CARD_DESC_MAX_LENGTH}" style="${descTab === 'preview' ? 'display:none' : ''}">${esc(descVal)}</textarea>
              <div class="desc-preview" id="desc-preview" style="${descTab === 'preview' ? 'display:block' : ''}">${descTab === 'preview' && descVal ? renderMarkdown(descVal) : ''}</div>
              <div class="form-hint" id="desc-hint" style="${descTab === 'preview' ? 'display:none' : ''}"><code>**bold**</code> <code>*italic*</code> <code>\`code\`</code> <code>[text](url)</code></div>
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;gap:6px">
                Checklist <span style="font-weight:400;color:var(--fg-3)">Enter to add</span>
              </label>
              <div class="checklist-wrap">
                ${checklist.map((item, idx) => `
                  <div class="checklist-item">
                    <input type="checkbox" class="checklist-check" data-act="toggle-checklist" data-item-id="${esc(item.id)}"${item.done ? ' checked' : ''}/>
                    <span class="checklist-text${item.done ? ' done' : ''}">${esc(item.text)}</span>
                    <button class="checklist-mv" data-act="checklist-up"   data-item-id="${esc(item.id)}" ${idx === 0 ? 'disabled' : ''}>${I.arrowUp}</button>
                    <button class="checklist-mv" data-act="checklist-down" data-item-id="${esc(item.id)}" ${idx === checklist.length - 1 ? 'disabled' : ''}>${I.arrowDown}</button>
                    <button class="checklist-rm" data-act="rm-checklist" data-item-id="${esc(item.id)}">${I.close}</button>
                  </div>`).join('')}
                <input class="form-input checklist-field" id="checklist-field" type="text"
                       value="${esc(pendingChecklistInput ?? '')}"
                       placeholder="Add item…" maxlength="${CHECKLIST_ITEM_MAX_LENGTH}" autocomplete="off"/>
              </div>
            </div>
          </div>
          <div class="modal-card-sidebar">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" id="card-prio">
                <option value="none"${prio==='none'?' selected':''}>None</option>
                <option value="low"${prio==='low'?' selected':''}>Low</option>
                <option value="medium"${prio==='medium'?' selected':''}>Medium</option>
                <option value="high"${prio==='high'?' selected':''}>High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" id="card-due" type="date" value="${esc(dueVal)}" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Column</label>
              <select class="form-select" id="card-col">${colOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;gap:6px">
                Tags <span style="font-weight:400;color:var(--fg-3)">Enter or ,</span>
              </label>
              <div class="tags-wrap" id="tags-wrap">
                ${tags.map(t => `
                  <span class="tag-chip">
                    ${esc(t)}
                    <button class="tag-chip-rm" data-act="rm-tag" data-tag="${esc(t)}">${I.close}</button>
                  </span>`).join('')}
                <input class="tag-field" id="tag-field" type="text"
                       value="${esc(pendingTagInput ?? '')}"
                       placeholder="${tags.length ? '' : 'Add tag…'}" maxlength="${TAG_MAX_LENGTH}" autocomplete="off"/>
                <div class="tag-suggestions" id="tag-suggestions"></div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Label Color</label>
              <div class="card-color-row">
                <div class="card-color-swatch${cardColor === 'none' ? ' active' : ''}"
                     data-act="pick-card-color" data-color="none"
                     title="None" style="background: transparent; border: 1px dashed var(--border)"></div>
                ${CARD_COLORS.map(c => `
                  <div class="card-color-swatch${c.v === cardColor ? ' active' : ''}"
                       style="background:${esc(c.v)}"
                       data-act="pick-card-color" data-color="${c.v}"
                       title="${c.name}"></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" data-act="close-modal">Cancel</button>
          <button class="btn btn-primary" data-act="submit-card">
            ${isEdit ? 'Save' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>`;
}
