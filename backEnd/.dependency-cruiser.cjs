/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'module-private-from-outside',
      comment:
        'Outside a module, only its index.ts (public API) may be imported.',
      severity: 'error',
      from: { pathNot: '^src/modules/' },
      to: { path: '^src/modules/[^/]+/', pathNot: '^src/modules/[^/]+/index\\.ts$' },
    },
    {
      name: 'module-private-from-other-module',
      comment:
        'A module may only use another module through its index.ts (public API).',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/[^/]+/',
        pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'shared-not-to-modules',
      comment: 'shared is used by modules, it must never depend on them.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    // TypeScript 7 (Go) no longer ships the JS API dependency-cruiser uses to parse .ts
    parser: 'swc',
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
