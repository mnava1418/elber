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
      name: 'no-cross-module-imports',
      comment:
        'Modules never import each other, not even their index.ts: they communicate through events (src/shared/events).',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'no-cross-skill-imports',
      comment:
        'Skills are plugins of the chat (src/modules/chat/skills/<skill>/) and never import each other.',
      severity: 'error',
      from: { path: '^src/modules/chat/skills/([^/]+)/' },
      to: { path: '^src/modules/chat/skills/', pathNot: '^src/modules/chat/skills/$1/' },
    },
    {
      name: 'skills-only-reach-the-contract',
      comment:
        'From the chat core, a skill only reaches the Skill contract (chat/domain/skill.ts), so it stays easy to pull out (e.g. into its own MCP server).',
      severity: 'error',
      from: { path: '^src/modules/chat/skills/' },
      to: { path: '^src/modules/chat/', pathNot: '^src/modules/chat/(skills/|domain/skill\\.ts$)' },
    },
    {
      name: 'chat-core-not-to-skills',
      comment:
        'The chat core knows only the Skill contract, never a concrete skill: only the chat index.ts assembles them.',
      severity: 'error',
      from: { path: '^src/modules/chat/', pathNot: '^src/modules/chat/(skills/|index\\.ts$)' },
      to: { path: '^src/modules/chat/skills/' },
    },
    {
      name: 'skill-private-from-chat',
      comment: 'The chat index.ts imports a skill only through its index.ts (public API).',
      severity: 'error',
      from: { path: '^src/modules/chat/index\\.ts$' },
      to: { path: '^src/modules/chat/skills/[^/]+/', pathNot: '^src/modules/chat/skills/[^/]+/index\\.ts$' },
    },
    {
      name: 'clean-arch-domain-is-innermost',
      comment:
        'In modules with clean architecture, domain/ depends on nothing from the outer layers.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/domain/' },
      to: { path: '^src/modules/$1/(application|infrastructure|presentation)/' },
    },
    {
      name: 'clean-arch-application-not-to-outer-layers',
      comment:
        'application/ talks to the outside only through ports defined in domain/, never to adapters.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/application/' },
      to: { path: '^src/modules/$1/(infrastructure|presentation)/' },
    },
    // Each skill inside the chat has its own clean architecture layers, with
    // the same two rules.
    {
      name: 'clean-arch-skill-domain-is-innermost',
      severity: 'error',
      from: { path: '^src/modules/chat/skills/([^/]+)/domain/' },
      to: { path: '^src/modules/chat/skills/$1/(application|infrastructure|presentation)/' },
    },
    {
      name: 'clean-arch-skill-application-not-to-outer-layers',
      severity: 'error',
      from: { path: '^src/modules/chat/skills/([^/]+)/application/' },
      to: { path: '^src/modules/chat/skills/$1/(infrastructure|presentation)/' },
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
    // and to read tsconfig.json, so there is no `tsConfig` option either: without
    // TS path aliases it changes nothing, and with TS 7 it only triggers a warning.
    parser: 'swc',
    doNotFollow: { path: 'node_modules' },
  },
};
