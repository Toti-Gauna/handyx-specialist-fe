// Después de build:hostinger: el sitio publicado no puede llevar fixtures ni el banner de prueba.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const marcas = ['(pedido de prueba)', 'mock-csrf-solo-en-memoria', 'Datos de prueba', 'Panel de prueba', 'clave-de-prueba-123', 'especialista@example.test', 'Cliente de prueba', '00000000-0000-4000-8000-0000000000a1', 'req-prueba-0001', 'Foto de prueba', 'Catálogo del kit', 'id-token-de-prueba', 'tok-prueba-recuperacion', 'especialista.google@example.test', 'Desviarme del trayecto', 'Trayecto de muestra'];
const recorrer = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? recorrer(join(d, n)) : [join(d, n)]));
const culpables = recorrer('out').filter((f) => /\.(js|html|txt)$/.test(f) && marcas.some((m) => readFileSync(f, 'utf8').includes(m)));
if (culpables.length) {
  console.error(`El build de producción contiene datos de prueba:\n- ${culpables.join('\n- ')}`);
  process.exit(1);
}
console.log('verificar-bundle: sin fixtures ni banner de prueba en out/');
