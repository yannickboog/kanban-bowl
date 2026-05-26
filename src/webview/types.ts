// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: 'none' | 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: string;
  dueDate?: string;
  color?: string;
  checklist?: ChecklistItem[];
  pinned?: boolean;
}

export type ColSort = 'priority' | 'due' | 'created' | 'title';

export interface Column {
  id: string;
  name: string;
  color: string;
  cards: Card[];
  collapsed: boolean;
  wipLimit?: number;
  sort?: ColSort;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
}

export interface AppState {
  version: 2;
  currentBoardId: string | null;
  boards: Board[];
}

export type UndoKind = 'card' | 'clear' | 'column' | 'board' | 'clone';

export interface UndoCard   { type: 'card';   card: Card;   colId: string; boardId: string; idx: number; }
export interface UndoClear  { type: 'clear';  cards: Card[]; colId: string; boardId: string; }
export interface UndoColumn { type: 'column'; col: Column;  boardId: string; idx: number; }
export interface UndoBoard  { type: 'board';  board: Board; idx: number; }
export interface UndoClone  { type: 'clone';  cardId: string; colId: string; boardId: string; }
export type PendingUndo = UndoCard | UndoClear | UndoColumn | UndoBoard | UndoClone;

export interface CtxMenuItem { id?: string; label?: string; sep?: boolean; dest?: boolean; }
export interface CtxMenu { x: number; y: number; itemIds: string[]; items: CtxMenuItem[]; }

export interface Toast { msg: string; isErr: boolean; undo: (() => void) | null; }

export type ModalKind = 'board' | 'column' | 'card';
export interface Modal {
  kind: ModalKind;
  data: unknown;
  pendingTags?: string[];
  newColor?: string;
  pendingTitle?: string;
  pendingDesc?: string;
  pendingPrio?: string;
  pendingColId?: string;
  pendingDueDate?: string;
  pendingCardColor?: string;
  pendingChecklist?: ChecklistItem[];
  pendingDescTab?: 'edit' | 'preview';
  pendingTagInput?: string;
  pendingChecklistInput?: string;
}

export interface DragCard   { cardId: string; fromColId: string; }
export interface DragColumn { colId: string; }
export interface DragBoard  { boardId: string; }
