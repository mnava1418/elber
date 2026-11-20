// tsc only emits .js: this copies every .md under src/ (the model's prompts
// and guides) to the same path under dist/, where the compiled code reads it
// relative to itself.
import { cpSync, statSync } from 'node:fs'

cpSync('src', 'dist', {
    recursive: true,
    // Directories must pass too, or cpSync doesn't walk into them.
    filter: (source) => statSync(source).isDirectory() || source.endsWith('.md'),
})
