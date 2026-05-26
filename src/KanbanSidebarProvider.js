// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

'use strict';

const vscode = require('vscode');
const crypto = require('crypto');


function getNonce() {
  return crypto.randomBytes(16).toString('base64');
}

class KanbanSidebarProvider {
  constructor(extensionUri, store) {
    this._extensionUri = extensionUri;
    this._store        = store;
    this._view         = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts:      true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.webview.html = this._buildHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => {
      switch (msg.type) {
        case 'ready':
          this._sendLoad();
          break;
        case 'open':
          vscode.commands.executeCommand('kanban-bowl.open');
          break;
        case 'openCard': {
          const { KanbanPanel } = require('./KanbanPanel');
          const wasOpen = !!KanbanPanel.currentPanel;
          vscode.commands.executeCommand('kanban-bowl.open');
          if (wasOpen) {
            setTimeout(() => {
              if (KanbanPanel.currentPanel) {
                KanbanPanel.currentPanel._panel.webview.postMessage({
                  type: 'openCard', cardId: msg.cardId, colId: msg.colId,
                });
              }
            }, 150);
          } else {
            KanbanPanel.pendingCard = { cardId: msg.cardId, colId: msg.colId };
          }
          break;
        }
        case 'switchBoard': {
          const data = this._store.load();
          data.currentBoardId = msg.boardId;
          this._store.save(data);
          const { KanbanPanel } = require('./KanbanPanel');
          if (KanbanPanel.currentPanel) KanbanPanel.currentPanel._sendLoad();
          if (KanbanPanel.onSave) KanbanPanel.onSave();
          break;
        }
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) this._sendLoad();
    });
  }

  refresh() {
    if (this._view?.visible) this._sendLoad();
  }

  _sendLoad() {
    this._view?.webview.postMessage({ type: 'load', data: this._store.load() });
  }

  _buildHtml(webview) {
    const styleUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js'));
    const nonce     = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="Yannick Boog">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">

  <link href="${styleUri}" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

module.exports = { KanbanSidebarProvider };
