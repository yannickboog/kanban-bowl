// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

let _render: () => void = () => {};

export function setRenderFn(fn: () => void): void { _render = fn; }
export function render(): void { _render(); }
