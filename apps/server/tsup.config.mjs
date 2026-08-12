import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts', 'src/main.ts'],
  format: ['esm'],
  noExternal: ['@signal-lost/game-engine', '@signal-lost/protocol'],
});
