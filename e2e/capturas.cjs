// Catálogo de capturas por pantalla y escenario (insumo de la fase 3 y de Handy Docs). Solo datos de prueba.
// Uso: npm run build && node e2e/capturas.cjs [carpeta]   ·   ANCHOS=360x740,390x844,820x1180 para otros tamaños.
// Cada captura es una carga completa: el estado de prueba arranca de los fixtures del escenario.
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');
const { servir } = require('./servidor.cjs');

const id = (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

// [nombre, ruta, texto que indica que terminó de cargar, escenario]
const PANTALLAS = [
  ['acceso', '/acceso/', 'Entrá a tu cuenta', 'nuevo'],
  ['registro', '/registro/', 'Crear tu cuenta', 'nuevo'],
  ['recuperar', '/recuperar/', 'Recuperar el acceso', 'nuevo'],
  ['alta-borrador', '/alta/', 'Tus datos', 'incompleto'],
  ['alta-en-revision', '/alta/', 'Próximos pasos', 'en_revision'],
  ['alta-correccion', '/alta/', 'Hay que corregir algo', 'correccion'],
  ['alta-rechazada', '/alta/', 'Alta rechazada', 'rechazado'],
  ['alta-habilitada', '/alta/', 'Alta habilitada', 'habilitado'],
  ['inicio-sin-habilitar', '/inicio/', 'Todavía no recibís pedidos', 'en_revision'],
  ['inicio', '/inicio/', 'Tu disponibilidad', 'habilitado'],
  ['disponibilidad', '/disponibilidad/', 'Zonas que cubrís', 'habilitado'],
  ['pedidos', '/pedidos/', 'Por orden de llegada', 'habilitado'],
  ['pedido-programado', `/pedidos/detalle/?id=${id(0xb2)}`, 'Propuesta del usuario', 'habilitado'],
  ['pedido-obra', `/pedidos/detalle/?id=${id(0xb4)}`, 'visita de presupuesto', 'habilitado'],
  ['avisos', '/notificaciones/', 'Abrir un aviso solo te muestra', 'habilitado'],
  ['mensajes', '/mensajes/', 'Cliente de prueba 2', 'habilitado'],
  ['hilo-cotizando', `/mensajes/hilo/?id=${id(0xd2)}`, 'Propuesta del usuario', 'habilitado'],
  ['hilo-trabajo', `/mensajes/hilo/?id=${id(0xd1)}`, 'Perfecto, te espero', 'habilitado'],
  ['trabajos', '/trabajos/', 'Cliente de prueba 5', 'habilitado'],
  ['trabajo-agendado', `/trabajos/detalle/?id=${id(0xc1)}`, 'Salgo hacia el lugar', 'habilitado'],
  ['trabajo-obra', `/trabajos/detalle/?id=${id(0xc4)}`, 'Etapas de la obra', 'habilitado'],
  ['trabajo-finalizado', `/trabajos/detalle/?id=${id(0xc2)}`, 'Trabajo terminado', 'habilitado'],
  ['agenda', '/agenda/', 'Borde naranja', 'habilitado'],
  ['caja', '/caja/', 'El pago va directo a vos', 'habilitado'],
  ['soporte', '/soporte/', 'Abrir un caso', 'habilitado'],
  ['caso', `/soporte/detalle/?id=${id(0x52)}`, 'El usuario no estaba en el lugar', 'habilitado'],
  ['cuenta', '/cuenta/', 'Quién ve qué', 'habilitado'],
  ['baja', '/baja/', 'Baja de tu cuenta', 'baja'],
];

async function main() {
  const carpeta = process.argv[2] ?? join(__dirname, '..', 'capturas');
  const anchos = (process.env.ANCHOS ?? '390x844').split(',').map((x) => x.split('x').map(Number));
  const srv = await servir();
  const base = `http://localhost:${srv.address().port}`;
  const nav = await chromium.launch();
  let fallas = 0;
  for (const [w, h] of anchos) {
    const dir = join(carpeta, `${w}x${h}`);
    mkdirSync(dir, { recursive: true });
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    for (const [nombre, ruta, texto, escenario] of PANTALLAS) {
      const p = await ctx.newPage();
      const sep = ruta.includes('?') ? '&' : '?';
      try {
        await p.goto(`${base}${ruta}${sep}escenario=${escenario}`);
        await p.getByText(texto).first().waitFor({ timeout: 8000 });
        await p.waitForTimeout(150);
        // Desborde horizontal: ningún elemento puede hacer scroll lateral la página.
        const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (desborde > 0) {
          fallas++;
          console.log(`✘ ${w}x${h} ${nombre}: desborde horizontal de ${desborde}px`);
        }
        await p.screenshot({ path: join(dir, `${nombre}.png`), fullPage: true });
      } catch (e) {
        fallas++;
        console.log(`✘ ${w}x${h} ${nombre}: ${e.message.split('\n')[0]}`);
      }
      await p.close();
    }
    await ctx.close();
  }
  await nav.close();
  srv.close();
  console.log(`${PANTALLAS.length * anchos.length - fallas}/${PANTALLAS.length * anchos.length} capturas OK en ${carpeta}`);
  process.exit(fallas ? 1 : 0);
}
main();
