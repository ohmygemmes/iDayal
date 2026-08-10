import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * La version affichée dans les Réglages vient d'ici, et d'ici seulement.
 *
 * Elle était recopiée à la main dans `App.tsx` : le paquet est passé en 1.3.0
 * pendant que l'écran continuait d'annoncer 1.2.0 — sans que rien ne le signale,
 * puisque les deux valeurs ne se connaissaient pas. Une seule source, et la
 * question ne se pose plus.
 */
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    host: true,
    port: 5173,
  },
});
