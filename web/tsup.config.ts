import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/components/index.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist-ds',
  external: ['react', 'react-dom', 'react-router-dom'],
  clean: true,
  tsconfig: 'tsconfig.app.json',
})
