import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Vite serves the project root during `npm run dev`, so the runtime asset paths
// used by the app (`sounds/…`, `img/…`, `css/…`) resolve as-is with no moves.
//
// For `npm run build`, Vite bundles src/main.ts and the CSS-referenced images
// into a self-contained `dist/`. The sound clips are only referenced by runtime
// string paths (`new Audio('sounds/…')`, `fetch('sounds/sounds.json')`), so Vite
// cannot discover them statically — copy them verbatim into the output instead.
// The `.mp3.meta` sidecars are build-only inputs and are intentionally skipped.
export default defineConfig({
  // This site is NOT served from the domain root (it lives under a sub-path,
  // e.g. a GitHub Pages project page like `/kaamelott/`). A relative base emits
  // relative asset URLs (`./assets/…`) so the build resolves correctly from any
  // mount point without hard-coding the deployment path. The runtime asset
  // paths (`sounds/…`) and share links (built from `window.location.href`) are
  // likewise relative, so they follow the same sub-path automatically.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'sounds/*.mp3', dest: 'sounds' },
        { src: 'sounds/sounds.json', dest: 'sounds' },
      ],
    }),
  ],
})
