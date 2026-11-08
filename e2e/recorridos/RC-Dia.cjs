// Recorrido RC-Dia del lienzo: F-InicioDia → F-InicioRuta → TR-EnCamino (lote 1.3) → H0-Modo → H0-ModoHerramientas →
// H0-ModoAyuda → H0-AntesDespues → H0-AntesLado → TR-Cobro → H0-Informe → H0-InformeEnviado (lote 2.3, el cierre).
// Además: avisar una demora con un toque, reordenar paradas con botones (no cambia el horario de ningún cliente),
// compartir la ubicación solo durante el viaje, «Ya llegué» de respaldo, el cobro informado ≠ verificado, tareas que
// empiezan por la seguridad, pausa, pedir ayuda sin ver teléfonos, fotos sin ubicación, el informe que se completa solo
// y la conformidad que da el cliente (el Panel de prueba hace de cliente). Axe en cada pantalla.
// Lo corre e2e/flujos.cjs (carga todos los e2e/recorridos/*.cjs) o solo: `node e2e/recorridos/RC-Dia.cjs` sobre out/.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const panel = async (p, ...acciones) => {
  await p.getByRole('button', { name: 'Panel de prueba' }).click();
  for (const a of acciones) await p.getByRole('button', { name: a }).click();
  await p.keyboard.press('Escape');
};

let AXE = null;
async function axe(p, nombre, { h1 = true } = {}) {
  AXE ??= readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  });
  assert.deepEqual(v, [], `axe en ${nombre}`);
  if (h1) assert.ok((await p.evaluate(() => document.querySelectorAll('h1').length)) <= 1, `${nombre}: como mucho un h1`);
}

/** Los botones de aceptar, cotizar o cobrar nunca se animan (pedido de Ignacio). */
async function sinAnimar(p, nombre) {
  const animados = await p.evaluate(() =>
    [...document.querySelectorAll('.ui-boton')].filter((b) => {
      const s = getComputedStyle(b);
      return s.animationName !== 'none' || b.getAnimations().length > 0;
    }).length,
  );
  assert.equal(animados, 0, `${nombre}: hay botones animados`);
}

const RECORRIDOS = [
  [
    'RC-Dia-1-tu-dia-hasta-el-cobro',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/inicio/?escenario=habilitado`);
      // Tu día en el Inicio: la tira de paradas y la próxima con escribirle, avisar demora y salir
      await ver(p, 'Tu día · 3 paradas');
      await p.getByRole('list', { name: 'Tus paradas de hoy' }).waitFor();
      await ver(p, 'Pierde la canilla');
      await foto('01-tu-dia');
      await axe(p, 'F-InicioDia');
      await sinAnimar(p, 'F-InicioDia');
      await p.getByRole('button', { name: 'Avisar una demora' }).click();
      await p.getByRole('button', { name: 'Llego 15 min tarde' }).click();
      await ver(p, 'Avisaste la demora');
      // Tu recorrido: reordenar con botones no le cambia el horario a nadie
      await p.getByRole('link', { name: 'Ver recorrido' }).click();
      await p.waitForURL('**/inicio/recorrido/');
      await ver(p, 'Tu recorrido', { exact: false });
      await ver(p, 'no le cambia el horario a ningún cliente');
      await ver(p, /Sale en/);
      await foto('02-recorrido');
      await axe(p, 'F-InicioRuta');
      await p.getByRole('button', { name: 'Bajar: Pierde la canilla' }).click();
      await p.locator('[aria-current="step"]').getByText('Retiro en ferretería').waitFor();
      await p.getByRole('button', { name: 'Subir: Pierde la canilla' }).click();
      await p.locator('[aria-current="step"]').getByText('Pierde la canilla').waitFor();
      await foto('03-recorrido-reordenado');
      // Salir: el viaje con la ubicación compartida solo durante el viaje
      await p.getByRole('button', { name: 'Salir para la parada 2' }).click();
      await p.waitForURL('**/en-camino/**');
      await ver(p, 'Vas para lo de Lucía Ferreyra');
      await ver(p, 'Compartí tu ubicación durante el viaje');
      await foto('04-en-camino');
      await axe(p, 'TR-EnCamino');
      await panel(p, 'Señal imprecisa');
      await p.getByRole('button', { name: 'Compartir mi ubicación' }).click();
      await ver(p, 'Lucía ve que vas en camino');
      await ver(p, 'Como estás ubicación imprecisa');
      await foto('05-compartiendo');
      await p.getByRole('button', { name: 'Ya llegué' }).click();
      // Llegada (respaldo) → el trabajo en el lugar; el Modo trabajo es del lote 2.3
      await p.waitForURL('**/trabajos/detalle/**');
      await ver(p, 'En el lugar');
      await ver(p, 'Avisaste con «Ya llegué» (ubicación imprecisa)');
      await p.getByRole('button', { name: 'Empezar el trabajo' }).click();
      // Modo trabajo (lote 2.3): se abre al empezar, con las tareas de seguridad primero
      await p.waitForURL('**/trabajos/modo/**');
      await ver(p, 'Tus tareas · 0 de 4');
      await p.locator('[aria-current="step"]').getByText('Cerrar la llave y descargar presión').waitFor();
      await foto('08-modo-trabajo');
      await axe(p, 'H0-Modo');
      await sinAnimar(p, 'H0-Modo');
      await p.getByRole('button', { name: 'Tarea lista' }).click();
      await ver(p, 'Tus tareas · 1 de 4');
      await p.getByRole('checkbox', { name: /Cerrar la llave/ }).uncheck();
      await ver(p, 'Tus tareas · 0 de 4');
      await p.getByRole('checkbox', { name: /Cerrar la llave/ }).check();
      await ver(p, 'Tus tareas · 1 de 4');
      await p.getByRole('button', { name: 'Pausar' }).click();
      await ver(p, 'El cronómetro está en pausa');
      await p.getByRole('button', { name: 'Seguir trabajando' }).click();
      await p.getByRole('button', { name: 'Pausar' }).waitFor();
      // Herramientas a mano, en una hoja
      await p.getByRole('button', { name: /^Herramientas/ }).click();
      await p.getByRole('dialog', { name: 'Herramientas' }).getByText('Calculadoras').waitFor();
      await foto('09-herramientas');
      await axe(p, 'H0-ModoHerramientas');
      await p.getByRole('dialog', { name: 'Herramientas' }).getByRole('link', { name: 'Pedir ayuda' }).click();
      // Pedir ayuda: llamar por un número puente, sumar a un contacto (invitación) o buscar uno nuevo
      await p.waitForURL('**/trabajos/modo/ayuda/**');
      await ver(p, 'Diego Herrera');
      await ver(p, 'Ocupado hasta las 19');
      await foto('10-pedir-ayuda');
      await axe(p, 'H0-ModoAyuda');
      await p.getByRole('button', { name: 'Llamar a Diego Herrera' }).click();
      await ver(p, 'ninguno de los dos ve el teléfono del otro');
      await ver(p, 'El número sirve hasta');
      await p.keyboard.press('Escape');
      await p.getByRole('button', { name: 'Sumar a Diego a este trabajo' }).click();
      await p.getByRole('button', { name: 'Invitar a Diego Herrera' }).click();
      await ver(p, 'Invitaste a Diego Herrera');
      await p.getByRole('link', { name: 'Buscar un profesional nuevo' }).waitFor();
      await p.getByRole('link', { name: 'Volver' }).click();
      // Antes y después: deslizar (con botones y teclado) y lado a lado, y qué cambiaste
      await p.waitForURL('**/trabajos/modo/?**');
      await p.getByRole('link', { name: 'Foto' }).click();
      await p.waitForURL('**/trabajos/antes-despues/**');
      await ver(p, 'Todavía no hay fotos');
      await p.getByRole('button', { name: 'Foto del antes' }).click();
      await ver(p, 'Falta la foto del después');
      await p.getByRole('button', { name: 'Foto del después' }).click();
      const manija = p.getByRole('slider', { name: 'Comparar el antes y el después' });
      await manija.waitFor();
      await manija.focus();
      await p.keyboard.press('ArrowRight');
      assert.equal(await manija.getAttribute('aria-valuetext'), 'Se ve 55 % del antes y 45 % del después');
      await p.getByRole('button', { name: 'Ver el después' }).click();
      assert.equal(await manija.getAttribute('aria-valuetext'), 'Se ve 0 % del antes y 100 % del después');
      await p.getByRole('button', { name: 'Agregar' }).click();
      await p.getByRole('dialog').getByLabel('Qué cambiaste', { exact: true }).fill('Cartucho nuevo');
      await p.getByRole('dialog').getByLabel('Detalle (si querés)').fill('Cerámico de 35 mm');
      await p.getByRole('button', { name: 'Sumar el cambio' }).click();
      await p.getByRole('button', { name: 'Quitar: Cartucho nuevo' }).waitFor();
      await foto('11-antes-despues');
      await axe(p, 'H0-AntesDespues');
      await p.getByRole('radio', { name: 'Lado a lado' }).check();
      await p.waitForURL('**vista=lado**');
      await p.locator('figcaption').first().waitFor();
      await foto('12-lado-a-lado');
      await axe(p, 'H0-AntesLado');
      await p.getByRole('button', { name: 'Sumar al informe' }).click();
      // El informe, todavía en curso: se completa solo y se manda al terminar
      await p.waitForURL('**/trabajos/informe/**');
      await ver(p, '1 par de fotos · 1 cambio escrito');
      await ver(p, 'Lo mandás cuando terminás el trabajo.');
      await axe(p, 'H0-Informe en curso');
      await p.getByRole('link', { name: 'Volver al Modo trabajo' }).click();
      await p.waitForURL('**/trabajos/modo/**');
      for (const n of [2, 3, 4]) {
        await p.getByRole('button', { name: 'Tarea lista' }).click();
        await ver(p, `Tus tareas · ${n} de 4`);
      }
      await p.locator('.ui-accion-fija').getByRole('button', { name: 'Terminé el trabajo' }).click();
      await ver(p, 'Total a cobrar');
      await p.getByRole('button', { name: 'Sí, terminé' }).click();
      // ¿Cómo te pagó?: informado por vos, todavía sin verificar
      await p.waitForURL('**/trabajos/cobro/**');
      await ver(p, 'Recibís el 100 %: directo a vos');
      await p.getByRole('radio', { name: 'Mercado Pago' }).check();
      await foto('06-como-te-pago');
      await axe(p, 'TR-Cobro');
      await p.getByRole('button', { name: 'Informar el cobro' }).click();
      await ver(p, 'Informado por vos · sin verificar');
      await ver(p, 'Queda «informado por vos» hasta que Lucía Ferreyra lo confirma');
      await foto('07-cobro-informado');
      await axe(p, 'TR-Cobro informado');
      // Informe del trabajo: secciones que se completan solas; se completa la que falta y se manda
      await p.getByRole('link', { name: 'Armar el informe' }).click();
      await p.waitForURL('**/trabajos/informe/**');
      await ver(p, 'Probar sin pérdidas 10 minutos');
      await p.getByRole('button', { name: /^Qué encontraste/ }).click();
      await p.getByRole('dialog').getByLabel('Qué encontraste').fill('El disco del cartucho estaba gastado.');
      await p.getByRole('button', { name: 'Guardar la sección' }).click();
      await ver(p, 'Guardaste la sección');
      await ver(p, 'Casi listo · 4 de 5');
      await foto('13-informe');
      await axe(p, 'H0-Informe');
      await sinAnimar(p, 'H0-Informe');
      await p.getByRole('button', { name: 'Mandar informe y pedir conformidad' }).click();
      await ver(p, 'Sin completar (no sale en el informe): Qué conviene hacer después.');
      await p.getByRole('radio', { name: 'En 1 año' }).check();
      await ver(p, 'Te avisamos a vos el 17/11/2027');
      await p.getByRole('button', { name: 'Mandar el informe' }).click();
      // Informe enviado: conformidad del cliente, garantía activa, recordatorio para vos y el cobro por verificar
      await p.waitForURL('**/trabajos/informe/enviado/**');
      await ver(p, 'Le llegó a');
      await ver(p, 'Esperando');
      await ver(p, '30 días · hasta el 17/12');
      await ver(p, '17/11/2027 · te avisamos a vos');
      await ver(p, 'Por verificar');
      await foto('14-informe-enviado');
      await axe(p, 'H0-InformeEnviado');
      await panel(p, 'Da su conformidad con el último informe');
      await ver(p, 'Dio su conformidad');
      await p.getByRole('link', { name: 'Volver a tu día' }).click();
      await p.waitForURL('**/inicio/**');
    },
  ],
  [
    'RC-Dia-2-modo-trabajo-agenda-y-notas',
    async ({ p, base, foto }) => {
      const deposito = '00000000-0000-4000-8000-000000023001';
      // Un trabajo que sigue de ayer: notas, una tarea nueva y la agenda desde el trabajo
      await p.goto(`${base}/trabajos/modo/?id=${deposito}&escenario=habilitado`);
      await ver(p, 'Tus tareas · 2 de 4');
      await p.getByRole('timer').waitFor();
      await p.getByRole('button', { name: /^Nota de voz o escrita/ }).click();
      await p.getByLabel('Tu nota').fill('El cliente pidió dejar la llave cerrada');
      await p.getByRole('button', { name: 'Guardar la nota' }).click();
      await ver(p, '2 en este trabajo · la ves solo vos');
      await p.getByRole('button', { name: 'Tarea', exact: true }).click();
      await p.getByLabel('¿Qué hay que hacer?').fill('Limpiar y secar el piso');
      await p.getByLabel('Es un paso de seguridad').check();
      await p.getByRole('button', { name: 'Sumar la tarea' }).click();
      await ver(p, 'Tus tareas · 2 de 5');
      await foto('01-modo-seguido');
      await p.getByRole('link', { name: 'Agenda' }).click();
      await p.waitForURL('**/trabajos/modo/agenda/**');
      await ver(p, 'Lo que sigue');
      await ver(p, 'Trabajo · Lucía Ferreyra');
      await foto('02-agenda-desde-el-trabajo');
      await axe(p, 'H0-ModoAgenda');
      await p.getByRole('button', { name: 'Llego 15 min tarde' }).click();
      await ver(p, 'Avisaste que llegás 15 minutos tarde.');
      assert.equal(await p.getByRole('button', { name: 'Llego 15 min tarde' }).getAttribute('aria-pressed'), 'true');
      await p.getByRole('link', { name: 'Proponer otro horario' }).waitFor();
      // Sin conexión no se guarda nada (sin cola offline): se avisa y se puede reintentar
      await p.goto(`${base}/trabajos/modo/?id=${deposito}`);
      await ver(p, 'Tus tareas · 2 de 4');
      await panel(p, 'Sin conexión (red caída)');
      await p.getByRole('button', { name: 'Tarea lista' }).click();
      await p.getByRole('alert').first().waitFor();
      await ver(p, 'Tus tareas · 2 de 4');
    },
  ],
];

module.exports = { RECORRIDOS };

// Solo: sirve out/ y corre estos recorridos.
if (require.main === module) {
  const { join } = require('node:path');
  const { servir } = require('../servidor.cjs');
  const { chromium } = require('playwright');
  (async () => {
    const srv = await servir();
    const base = `http://localhost:${srv.address().port}`;
    const nav = await chromium.launch();
    let mal = 0;
    for (const [nombre, pasos, o = {}] of RECORRIDOS) {
      if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) continue;
      const ctx = await nav.newContext({ viewport: { width: o.ancho ?? 390, height: o.alto ?? 844 }, reducedMotion: o.movimiento ?? 'reduce' });
      const p = await ctx.newPage();
      const errores = [];
      p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
      p.on('console', (m) => m.type() === 'error' && !/Failed to load resource|bad HTTP response code|Worker failed/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
      p.setDefaultTimeout(8000);
      const capturas = process.env.CAPTURAS;
      const foto = async (n) => capturas && p.screenshot({ path: join(capturas, `${nombre}-${n}.png`) });
      try {
        await pasos({ p, base, foto });
        assert.deepEqual(errores, [], 'errores de consola');
        console.log(`✔ ${nombre}`);
      } catch (e) {
        mal += 1;
        await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`) }).catch(() => undefined);
        console.log(`✘ ${nombre}: ${e.message.split('\n').slice(0, 6).join(' | ')}`);
      } finally {
        await ctx.close();
      }
    }
    await nav.close();
    srv.close();
    process.exit(mal ? 1 : 0);
  })();
}
