// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

export function uid(): string {
  return 'yb-' + crypto.randomUUID();
}
