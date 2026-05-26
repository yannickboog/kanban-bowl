// Kanban Bowl — VS Code Extension
// Copyright © 2026 Yannick Boog. All rights reserved.
// Licensed under the Apache License, Version 2.0

import * as esbuild from 'esbuild';

const banner = [
  '// Kanban Bowl — VS Code Extension',
  '// Copyright © 2026 Yannick Boog. All rights reserved.',
  '// Licensed under the Apache License, Version 2.0',
].join('\n');

const watch = process.argv.includes('--watch');

const shared = { bundle: true, platform: 'browser', target: 'es2020', format: 'iife', banner: { js: banner } };

const ctxMain    = await esbuild.context({ ...shared, entryPoints: ['src/webview/main.ts'],  outfile: 'media/main.js' });
const ctxSidebar = await esbuild.context({ ...shared, entryPoints: ['src/sidebar/main.ts'], outfile: 'media/sidebar.js' });

if (watch) {
  await ctxMain.watch();
  await ctxSidebar.watch();
  console.log('Watching…');
} else {
  await ctxMain.rebuild();    await ctxMain.dispose();
  await ctxSidebar.rebuild(); await ctxSidebar.dispose();
}
