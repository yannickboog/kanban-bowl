// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

'use strict';

const { KanbanPanel }           = require('./src/KanbanPanel');
const { KanbanStore }           = require('./src/KanbanStore');
const { KanbanSidebarProvider } = require('./src/KanbanSidebarProvider');

const AUTHOR  = 'Yannick Boog';
const WEBSITE = 'https://github.com/yannickboog/kanban-bowl';

function isValidImport(data) {
  if (!data || typeof data !== 'object') return false;
  const boards = data.boards ?? (data.columns ? [{ columns: data.columns }] : null);
  if (!Array.isArray(boards)) return false;
  return boards.every(b =>
    b && typeof b === 'object' &&
    Array.isArray(b.columns ?? []) &&
    (b.columns ?? []).every(c =>
      c && typeof c === 'object' && Array.isArray(c.cards ?? [])
    )
  );
}

let store    = null;
let sidebar  = null;

function activate(context) {
  const vscode = require('vscode');

  store   = new KanbanStore(context);
  sidebar = new KanbanSidebarProvider(context.extensionUri, store);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('kanban-bowl.sidebar', sidebar)
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'kanban-bowl.quickMenu';
  statusBar.tooltip = 'Kanban Bowl';
  context.subscriptions.push(statusBar);

  function updateStatusBar() {
    const data = store.load();
    if (!data?.boards?.length) {
      statusBar.text = '$(tasklist) Kanban Bowl';
    } else {
      const board = data.boards.find(b => b.id === data.currentBoardId) ?? data.boards[0];
      const todayMs = new Date(new Date().toDateString()).getTime();
      const overdue = board?.columns?.reduce((acc, col) =>
        acc + col.cards.filter(c => c.dueDate && new Date(c.dueDate + 'T00:00:00').getTime() < todayMs).length, 0) ?? 0;
      statusBar.text = overdue
        ? `$(tasklist) ${board?.name ?? 'Kanban Bowl'}  $(warning) ${overdue}`
        : `$(tasklist) ${board?.name ?? 'Kanban Bowl'}`;
    }
    statusBar.show();
  }

  KanbanPanel.onSave = () => { updateStatusBar(); sidebar.refresh(); };
  updateStatusBar();

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const cfg        = vscode.workspace.getConfiguration('kanban-bowl');
      const scopePerWs = cfg.get('workspaceBoards', true);
      const hasWs      = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
      store.switchScope(scopePerWs && hasWs);
      updateStatusBar();
      sidebar.refresh();
      if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('kanban-bowl.workspaceBoards')) {
        const cfg        = vscode.workspace.getConfiguration('kanban-bowl');
        const scopePerWs = cfg.get('workspaceBoards', true);
        const hasWs      = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
        store.switchScope(scopePerWs && hasWs);
        updateStatusBar();
        sidebar.refresh();
        if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad();
      }
      if (e.affectsConfiguration('kanban-bowl.defaultColumns')) {
        if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendConfig();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.quickMenu', async () => {
      const data = store.load();
      const items = [
        { label: '$(layout-panel-left) Open Board', action: 'open' },
      ];
      if (data?.boards?.length > 1) {
        items.push({ label: '$(arrow-swap) Switch Board…', action: 'switch' });
      }
      items.push({ label: '$(search) Find Card…', action: 'findCard' });

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Kanban Bowl',
      });
      if (!picked) return;

      if (picked.action === 'open') {
        KanbanPanel.createOrShow(context.extensionUri, store);
      } else if (picked.action === 'switch') {
        const boardItems = data.boards.map(b => ({
          label: b.id === data.currentBoardId ? `$(check) ${b.name}` : `$(dash) ${b.name}`,
          id: b.id,
        }));
        const board = await vscode.window.showQuickPick(boardItems, { placeHolder: 'Switch to board…' });
        if (!board) return;
        data.currentBoardId = board.id;
        await store.importData(data);
        updateStatusBar();
        sidebar.refresh();
        if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad();
        else KanbanPanel.createOrShow(context.extensionUri, store);
      } else if (picked.action === 'findCard') {
        vscode.commands.executeCommand('kanban-bowl.findCard');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.open', () => {
      KanbanPanel.createOrShow(context.extensionUri, store);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.walkthrough', () => {
      vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'YannickBoog.kanban-bowl#gettingStarted',
        false
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.about', async () => {
      const action = await vscode.window.showInformationMessage(
        `Kanban Bowl — by ${AUTHOR} — Apache License 2.0`,
        'Visit Website'
      );
      if (action === 'Visit Website') {
        vscode.env.openExternal(vscode.Uri.parse(WEBSITE));
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.findCard', async () => {
      const data = store.load();
      const board = data?.boards?.find(b => b.id === data.currentBoardId) ?? data?.boards?.[0];
      if (!board) { vscode.window.showInformationMessage('No Kanban Bowl boards found.'); return; }

      const items = [];
      for (const col of board.columns) {
        for (const card of col.cards) {
          items.push({
            label:       card.title || '(no title)',
            description: col.name,
            detail:      card.description?.slice(0, 120) || undefined,
            cardId: card.id,
            colId:  col.id,
          });
        }
      }
      if (!items.length) { vscode.window.showInformationMessage('No cards on this board.'); return; }

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder:       'Find card…',
        matchOnDescription: true,
        matchOnDetail:      true,
      });
      if (!picked) return;

      const wasOpen = !!KanbanPanel.currentPanel;
      KanbanPanel.createOrShow(context.extensionUri, store);
      if (wasOpen) {
        KanbanPanel.currentPanel._panel.webview.postMessage({ type: 'openCard', cardId: picked.cardId, colId: picked.colId });
      } else {
        KanbanPanel.pendingCard = { cardId: picked.cardId, colId: picked.colId };
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.export', async () => {
      const data = store.load();
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('kanban-bowl-export.json'),
        filters: { 'JSON': ['json'] },
      });
      if (!uri) return;
      await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(data, null, 2), 'utf-8'));
      vscode.window.showInformationMessage(`Kanban Bowl data exported to ${uri.fsPath}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.import', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { 'JSON': ['json'] },
      });
      if (!uris?.length) return;
      const answer = await vscode.window.showWarningMessage(
        'Import will replace all current data. This cannot be undone.',
        { modal: true },
        'Import'
      );
      if (answer !== 'Import') return;
      let data;
      try {
        const bytes = await vscode.workspace.fs.readFile(uris[0]);
        data = JSON.parse(Buffer.from(bytes).toString('utf-8'));
      } catch (err) {
        vscode.window.showErrorMessage(`Kanban Bowl: Invalid JSON — ${err.message}`);
        return;
      }
      if (!isValidImport(data)) {
        vscode.window.showErrorMessage('Kanban Bowl: File does not appear to be a valid Kanban Bowl export.');
        return;
      }
      await store.importData(data);
      updateStatusBar();
      sidebar.refresh();
      if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad(true);
      vscode.window.showInformationMessage('Kanban Bowl data imported.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kanban-bowl.reset', async () => {
      const answer = await vscode.window.showWarningMessage(
        'Reset all Kanban Bowl data? This cannot be undone.',
        { modal: true },
        'Reset'
      );
      if (answer !== 'Reset') return;
      await store.reset();
      updateStatusBar();
      sidebar.refresh();
      if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad(true);
    })
  );
}

async function deactivate() {
  if (store) await store.flush();
}

module.exports = { activate, deactivate };
