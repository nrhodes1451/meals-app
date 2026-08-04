import next from 'eslint-config-next';

/*
  Ported from the Penrose adherence config
  (docs/design/meal-planner/_ds/.../_adherence.oxlintrc.json).

  Hex is an error: CLAUDE.md says do not hardcode hex values in components, and every
  colour in this system has a token. The adherence config also bans raw px literals, which
  is not carried over as a rule: the design specifies exact grid column templates and row
  heights that are not worth a theme key each, so the ban would fire on legitimate values.
  Sizes that are constraints rather than layout - the touch targets - are theme keys
  instead, so they read as `h-touch` and cannot silently drift.
*/
const penroseAdherence = {
  files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
        message: 'Raw hex colour - use a Penrose token from styles/tokens.css.',
      },
    ],
  },
};

const config = [
  { ignores: ['docs/**', '.next/**', '.pglite/**', 'db/migrations/**'] },
  ...next,
  penroseAdherence,
];

export default config;
