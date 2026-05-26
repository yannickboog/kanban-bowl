// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { toastTimer, setToast, setToastTimer, setPendingUndo } from '../state.js';
import { render } from '../renderRef.js';
import { TOAST_DURATION_MS } from '../constants.js';

export function showToast(msg: string, { isErr = false, undo = null }: { isErr?: boolean; undo?: (() => void) | null } = {}): void {
  if (toastTimer) clearTimeout(toastTimer);
  setToast({ msg, isErr, undo });
  render();
  setToastTimer(setTimeout(() => {
    setPendingUndo(null);
    setToast(null);
    setToastTimer(null);
    render();
  }, TOAST_DURATION_MS));
}
