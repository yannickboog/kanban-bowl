// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

'use strict';

const vscode = require('vscode');
const crypto = require('crypto');

function getNonce() {
  return crypto.randomBytes(16).toString('base64');
}

class KanbanPanel {
  static createOrShow(extensionUri, store) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (KanbanPanel.currentPanel) {
      KanbanPanel.currentPanel._panel.reveal(KanbanPanel.currentPanel._panel.viewColumn);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'kanbanBowl',
      'Kanban Bowl',
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        retainContextWhenHidden: true,
      }
    );

    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'icon-panel.svg');

    KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri, store);
  }

  constructor(panel, extensionUri, store) {
    this._panel        = panel;
    this._extensionUri = extensionUri;
    this._store        = store;
    this._disposables  = [];

    this._panel.webview.html = this._buildHtml(this._panel.webview);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(
      e => { if (e.webviewPanel.visible) { this._sendLoad(); this._sendConfig(); } },
      null,
      this._disposables
    );
    this._panel.webview.onDidReceiveMessage(
      msg => this._handleMessage(msg),
      null,
      this._disposables
    );
  }

  _sendLoad(reset = false) {
    this._panel.webview.postMessage({ type: 'load', data: this._store.load(), ...(reset ? { reset: true } : {}) });
  }

  _sendConfig() {
    const cfg = vscode.workspace.getConfiguration('kanban-bowl');
    const raw = cfg.get('defaultColumns');
    const defaultColumns = Array.isArray(raw) && raw.length
      ? raw
      : [
          { name: 'To Do', color: '#3B82F6' },
          { name: 'Doing', color: '#F59E0B' },
          { name: 'Done',  color: '#22C55E' },
        ];
    this._panel.webview.postMessage({ type: 'config', defaultColumns });
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'ready':
        this._sendLoad();
        this._sendConfig();
        if (KanbanPanel.pendingCard) {
          const pending = KanbanPanel.pendingCard;
          KanbanPanel.pendingCard = null;
          setTimeout(() => {
            if (KanbanPanel.currentPanel) {
              this._panel.webview.postMessage({ type: 'openCard', ...pending });
            }
          }, 150);
        }
        break;
      case 'save':
        if (msg.data) {
          this._store.save(msg.data);
          if (KanbanPanel.onSave) KanbanPanel.onSave();
        }
        break;
    }
  }

  _buildHtml(webview) {
    const styleUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="Yannick Boog">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Kanban Bowl</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose() {
    KanbanPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}

KanbanPanel.currentPanel = undefined;
KanbanPanel.pendingCard  = null;
KanbanPanel.onSave       = null;

module.exports = { KanbanPanel };
