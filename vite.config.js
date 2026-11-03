// El visor: npm run dev para trabajar, npm run visor para dejarlo en dist/
// como pagina estatica.
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'visor',
  // rutas relativas, para que dist/ se pueda servir desde cualquier carpeta
  base: './',
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022' },
  worker: { format: 'es' },
});
