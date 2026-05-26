// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import { esc } from './esc.js';

export function renderMarkdown(raw: string): string {
  return raw.split('\n').map(parseLine).join('<br>');
}

function parseLine(line: string): string {
  let i = 0;
  let out = '';

  while (i < line.length) {
    const ch = line[i];

    if (ch === '`') {
      const end = line.indexOf('`', i + 1);
      if (end !== -1) {
        out += `<code>${esc(line.slice(i + 1, end))}</code>`;
        i = end + 1;
        continue;
      }
    }

    if (ch === '[') {
      const closeB = line.indexOf(']', i + 1);
      if (closeB !== -1 && line[closeB + 1] === '(') {
        const closeP = line.indexOf(')', closeB + 2);
        if (closeP !== -1) {
          const text = line.slice(i + 1, closeB);
          const url  = line.slice(closeB + 2, closeP);
          if (/^https?:\/\//i.test(url)) {
            out += `<a href="${esc(url)}">${esc(text)}</a>`;
            i = closeP + 1;
            continue;
          }
        }
      }
    }

    if (ch === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2);
      if (end !== -1) {
        out += `<strong>${esc(line.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    }

    if (ch === '*') {
      const end = line.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1) {
        out += `<em>${esc(line.slice(i + 1, end))}</em>`;
        i = end + 1;
        continue;
      }
    }

    if (ch === 'h' && (line.startsWith('https://', i) || line.startsWith('http://', i))) {
      let end = i;
      while (end < line.length && !/[\s<>"'`\]]/.test(line[end])) end++;
      const url = line.slice(i, end);
      out += `<a href="${esc(url)}">${esc(url)}</a>`;
      i = end;
      continue;
    }

    if (ch === '&') { out += '&amp;';  i++; continue; }
    if (ch === '<') { out += '&lt;';   i++; continue; }
    if (ch === '>') { out += '&gt;';   i++; continue; }
    if (ch === '"') { out += '&quot;'; i++; continue; }

    out += ch;
    i++;
  }

  return out;
}
