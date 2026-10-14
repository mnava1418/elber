// esbuild's CSS printer strips inline comments even with legalComments set,
// so annotations like `/* @kind font */` on token declarations (which
// Claude Design reads to classify tokens) never survive the tsup build.
// This patches them back onto the compiled dist-ds/index.css after build.
import { readFileSync, writeFileSync } from 'node:fs'

const CSS_PATH = new URL('../dist-ds/index.css', import.meta.url)
const ANNOTATIONS = {
  '--sans': '@kind font',
  '--mono': '@kind font',
}

let css = readFileSync(CSS_PATH, 'utf8')

for (const [prop, note] of Object.entries(ANNOTATIONS)) {
  const re = new RegExp(`(${prop}:[\\s\\S]*?);`, 'm')
  const match = css.match(re)
  if (!match) {
    console.warn(`! patch-ds-css: ${prop} not found in dist-ds/index.css, skipping`)
    continue
  }
  css = css.replace(re, `$1; /* ${note} */`)
}

writeFileSync(CSS_PATH, css)
console.log('patch-ds-css: re-applied token annotations')
