// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

'use strict';

const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const vscode = require('vscode');

const STATE_KEY       = 'kanbanBowl.YB26.data';
const LEGACY_KEY      = 'kanbanBowlData';
const LEGACY_FILE     = 'kanban-bowl.json';
const SAVE_DEBOUNCE   = 300;

function uid() {
  return crypto.randomUUID();
}

function defaultColumns() {
  const cfg  = vscode.workspace.getConfiguration('kanban-bowl');
  const cols = cfg.get('defaultColumns') || [
    { name: 'To Do', color: '#3B82F6' },
    { name: 'Doing', color: '#F59E0B' },
    { name: 'Done',  color: '#22C55E' },
  ];
  return cols.map(c => ({ id: uid(), name: c.name || 'Column', color: c.color || '#6B7280', cards: [], collapsed: false }));
}

function freshStore() {
  const boardId = uid();
  return migrate({
    version: 2,
    currentBoardId: boardId,
    boards: [{ id: boardId, name: 'My Board', columns: defaultColumns() }],
  });
}

function migrate(data) {
  if (data?.boards) {
    data.boards.forEach(b => {
      if (typeof b.id   !== 'string' || !b.id)   b.id   = uid();
      if (typeof b.name !== 'string')             b.name = 'Board';
      if (!Array.isArray(b.columns)) b.columns = [];
      b.columns.forEach(c => {
        if (typeof c.id        !== 'string' || !c.id) c.id        = uid();
        if (typeof c.name      !== 'string')          c.name      = 'Column';
        if (typeof c.color     !== 'string' || !c.color) c.color  = '#6B7280';
        if (typeof c.collapsed !== 'boolean')         c.collapsed = false;
        if (!Array.isArray(c.cards)) c.cards = [];
        c.cards = c.cards.filter(card => card !== null && typeof card === 'object');
        c.cards.forEach(card => {
          if (typeof card.id !== 'string' || !card.id) card.id = uid();
          if (typeof card.title       !== 'string') card.title       = String(card.title       ?? '');
          if (typeof card.description !== 'string') card.description = String(card.description ?? '');
          if (typeof card.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(card.dueDate) || isNaN(new Date(card.dueDate + 'T00:00:00').getTime())) card.dueDate = undefined;
          if (typeof card.createdAt !== 'string' || isNaN(new Date(card.createdAt).getTime())) card.createdAt = new Date().toISOString();
          if (!['none','low','medium','high'].includes(card.priority)) card.priority = 'none';
          if (typeof card.color !== 'string')       card.color       = undefined;
          if (!Array.isArray(card.tags))            card.tags        = [];
          card.tags = card.tags.filter(t => typeof t === 'string');
          if (!Array.isArray(card.checklist))       card.checklist   = [];
          card.checklist = card.checklist
            .filter(i => i && typeof i === 'object')
            .map(i => ({
              id:   typeof i.id   === 'string' && i.id ? i.id : uid(),
              text: typeof i.text === 'string'          ? i.text : String(i.text ?? ''),
              done: !!i.done,
            }));
        });
      });
    });
    const ids = data.boards.map(b => b.id);
    if (!ids.includes(data.currentBoardId)) data.currentBoardId = ids[0] ?? null;
    return data;
  }
  const boardId = uid();
  return migrate({
    version: 2,
    currentBoardId: boardId,
    boards: [{ id: boardId, name: 'My Board', columns: data?.columns || defaultColumns() }],
  });
}

class KanbanStore {
  constructor(context) {
    const cfg             = vscode.workspace.getConfiguration('kanban-bowl');
    const scopePerWs      = cfg.get('workspaceBoards', true);
    const hasWorkspace    = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
    this._useWorkspace    = scopePerWs && hasWorkspace;
    this._globalState     = context.globalState;
    this._workspaceState  = context.workspaceState;
    this._state           = this._useWorkspace ? this._workspaceState : this._globalState;
    this._saveTimer       = null;
    this._pendingData     = null;
    this._legacyPath      = path.join(context.globalStorageUri.fsPath, LEGACY_FILE);

    if (!this._useWorkspace) {
      this._migrateLegacyKey();
      this._migrateFromFile();
    }
  }

  switchScope(useWorkspace) {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      const data = this._pendingData;
      this._pendingData = null;
      this._state.update(STATE_KEY, data);
    }
    this._useWorkspace = useWorkspace;
    this._state        = useWorkspace ? this._workspaceState : this._globalState;
  }

  load() {
    if (this._pendingData) return migrate(this._pendingData);
    const stored = this._state.get(STATE_KEY);
    if (stored) return migrate(stored);
    if (!this._useWorkspace) {
      const legacyStored = this._globalState.get(LEGACY_KEY);
      if (legacyStored) return migrate(legacyStored);
      try {
        if (fs.existsSync(this._legacyPath)) {
          return migrate(JSON.parse(fs.readFileSync(this._legacyPath, 'utf-8')));
        }
      } catch {}
    }
    return freshStore();
  }

  save(data) {
    this._pendingData = data;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._state.update(STATE_KEY, this._pendingData);
      this._saveTimer   = null;
      this._pendingData = null;
    }, SAVE_DEBOUNCE);
  }

  async importData(data) {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    this._pendingData = null;
    await this._state.update(STATE_KEY, migrate(data));
  }

  async reset() {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    this._pendingData = null;
    await this._state.update(STATE_KEY, freshStore());
  }

  flush() {
    if (!this._saveTimer) return Promise.resolve();
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
    const data = this._pendingData;
    this._pendingData = null;
    return this._state.update(STATE_KEY, data);
  }

  async _migrateLegacyKey() {
    try {
      if (this._state.get(STATE_KEY)) return;
      const legacy = this._state.get(LEGACY_KEY);
      if (!legacy) return;
      await this._state.update(STATE_KEY, legacy);
      await this._state.update(LEGACY_KEY, undefined);
    } catch {}
  }

  async _migrateFromFile() {
    try {
      if (!fs.existsSync(this._legacyPath)) return;
      if (this._state.get(STATE_KEY)) { fs.unlinkSync(this._legacyPath); return; }
      const data = JSON.parse(fs.readFileSync(this._legacyPath, 'utf-8'));
      await this._state.update(STATE_KEY, migrate(data));
      fs.unlinkSync(this._legacyPath);
    } catch {}
  }
}

module.exports = { KanbanStore };
