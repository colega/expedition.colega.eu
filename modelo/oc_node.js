// Arranca OpenCascade en Node, con el wasm del paquete.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opencascade from 'replicad-opencascadejs';
import { setOC } from 'replicad';

export async function iniciar() {
  const require = createRequire(import.meta.url);
  const wasmBinary = readFileSync(require.resolve('replicad-opencascadejs/wasm'));
  setOC(await opencascade({ wasmBinary }));
}
