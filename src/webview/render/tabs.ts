// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { appState, searchQuery, dragOverBoard } from '../state.js';
import { esc } from '../esc.js';
import { I } from '../icons.js';

export function renderBoardTabs(): string {
  const cur = appState.currentBoardId;

  return `
    <div class="board-tabs" id="board-tabs">
      ${appState.boards.map(b => `
        <div class="board-tab${b.id === cur ? ' active' : ''}${dragOverBoard === b.id ? ' tab-drag-over' : ''}"
             draggable="true" data-act="switch-board" data-board="${esc(b.id)}"
             title="${esc(b.name)}">
          <span class="board-tab-name">${esc(b.name)}</span>
          ${appState.boards.length > 1 ? `
            <button class="board-tab-close" data-act="close-board" data-board="${esc(b.id)}" title="Delete board">
              ${I.close}
            </button>` : ''}
        </div>`).join('')}
      <button class="board-tab-add" data-act="add-board" title="New board">
        ${I.plus}
      </button>
      <div class="board-tabs-spacer"></div>
      ${appState.boards.length ? `
        <div class="tab-search">
          <span class="tab-search-icon">${I.search}</span>
          <input id="search" class="tab-search-input" type="text"
                 placeholder="Search…" value="${esc(searchQuery)}"
                 autocomplete="off" spellcheck="false"/>
          ${searchQuery ? `<button class="tab-search-clear" data-act="clear-search">${I.close}</button>` : ''}
        </div>
        <button class="tab-add-col-btn" data-act="add-col" title="Add column">
          ${I.plus} Column
        </button>` : ''}
    </div>`;
}
