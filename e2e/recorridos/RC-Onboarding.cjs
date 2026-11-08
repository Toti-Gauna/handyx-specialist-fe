// Recorrido RC-Onboarding del lienzo (lote 1.2): de crear la cuenta al primer día disponible, con los datos de prueba.
// RG-1 → código al email → RG-2 a RG-10 → D6-Alta → Operations habilita (Panel de prueba) → OB-Aprobado → OB-Permisos
// → OB-Tour → OB-PrimerosPasos → Inicio. Además: el registro se retoma donde quedó y una corrección pedida.
// Uso suelto: npx next build --webpack && node e2e/recorridos/RC-Onboarding.cjs   (o desde e2e/flujos.cjs)
// Dentro de un escenario se navega SIN recargar: el estado de prueba vive en la memoria de la pestaña.
const assert = require('node:assert/strict');

const CODIGO = '482913';

const panel = async (p, ...acciones) => {
  for (const a of acciones) {
    await p.getByRole('button', { name: 'Panel de prueba' }).click();
    await p.getByRole('button', { name: a }).click();
    await p.keyboard.press('Escape');
  }
};
const ver = (p, t, o) => p.getByText(t, o).first().waitFor();
const seguir = (p, nombre = 'Seguir') => p.getByRole('button', { name: nombre, exact: true }).click();
const paso = (p, n) => ver(p, `Paso ${n} de 10`);

/** Lista de [nombre, función] para que la use e2e/flujos.cjs con su `escenario()`. */
const RECORRIDOS = [
  [
    'RC-Onboarding-de-la-cuenta-al-primer-dia',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/registro/?escenario=nuevo`);
      // RG-1: vacío → errores con texto y el foco en el primero
      await paso(p, 1);
      await foto('01-rg1');
      await seguir(p, 'Crear mi cuenta');
      await ver(p, 'Escribí tu nombre.');
      assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid')), 'true', 'el foco va al primer campo con error');
      await p.getByLabel('Nombre', { exact: true }).fill('Julián');
      await p.getByLabel('Apellido', { exact: true }).fill('Ortiz');
      await p.getByLabel('Celular', { exact: true }).fill('223 555-4521');
      await p.getByLabel('Email', { exact: true }).fill('julian.ortiz@example.test');
      await p.getByLabel('Creá una contraseña', { exact: true }).fill('una-clave-larga-123');
      await p.getByRole('checkbox', { name: /Leí y acepto/ }).check();
      await seguir(p, 'Crear mi cuenta');
      // Código al email (pantalla del lote 1.1)
      await p.waitForURL('**/verificar/');
      await p.getByLabel(/Código/).first().fill(CODIGO);
      const completar = p.getByRole('button', { name: 'Completar mi alta' });
      await Promise.race([completar.waitFor().then(() => completar.click()), p.waitForURL('**/alta/**')]);
      await p.waitForURL('**/alta/**');
      // RG-2 Domicilio (los datos del paso 1 ya están)
      await paso(p, 2);
      await ver(p, 'Nunca se lo mostramos a nadie');
      await foto('02-rg2');
      await p.getByLabel('Calle', { exact: true }).fill('Calle De Prueba');
      await p.getByLabel('Número', { exact: true }).fill('123');
      await p.getByLabel('Barrio', { exact: true }).fill('La Perla');
      await seguir(p);
      // RG-3 Rubros: Gas pide matrícula
      await paso(p, 3);
      await p.getByRole('checkbox', { name: /Plomería/ }).check();
      await p.getByRole('checkbox', { name: /^Gas/ }).check();
      await ver(p, 'Gas: con matrícula');
      await foto('03-rg3');
      await seguir(p, 'Seguir con 2 rubros');
      // RG-4 Zonas
      await paso(p, 4);
      await p.getByRole('checkbox', { name: 'Centro', exact: true }).check();
      await p.getByRole('checkbox', { name: 'La Perla', exact: true }).check();
      await ver(p, '2 barrios elegidos');
      await foto('04-rg4');
      await seguir(p);
      // RG-5 Selfie (cámara simulada)
      await paso(p, 5);
      await ver(p, 'Cámara simulada: no se usa la tuya');
      await foto('05-rg5');
      await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
      await p.getByRole('button', { name: 'Usar esta foto' }).click();
      // RG-6 DNI frente y dorso
      await paso(p, 6);
      await p.getByLabel('Número de DNI', { exact: true }).fill('30111222');
      await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
      await p.getByRole('button', { name: 'Seguir con el dorso' }).click();
      await ver(p, 'Ahora el dorso, dentro del marco');
      await foto('06-rg6');
      await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
      await p.getByRole('button', { name: 'Usar las dos fotos' }).click();
      // RG-7 CUIT o CUIL
      await paso(p, 7);
      await p.getByLabel('CUIT o CUIL', { exact: true }).fill('20-12345678-9');
      await p.getByRole('radio', { name: 'Monotributo' }).check();
      await seguir(p);
      await ver(p, 'no parece un CUIT o CUIL');
      await p.getByLabel('CUIT o CUIL', { exact: true }).fill('20-12345678-6');
      await foto('07-rg7');
      await seguir(p);
      // RG-8 Certificados: la matrícula de Gas es obligatoria
      await paso(p, 8);
      await seguir(p);
      await ver(p, 'Cargá la matrícula de gasista para seguir');
      await p.getByRole('button', { name: 'PDF · Gas' }).click();
      await ver(p, 'Cargado · falta revisar');
      await foto('08-rg8');
      await seguir(p);
      // RG-9 Antecedentes por foto o PDF
      await paso(p, 9);
      await ver(p, 'lo ve solo el equipo de verificación de Handyx');
      await p.getByRole('button', { name: 'Subir el PDF' }).click();
      await ver(p, 'PDF cargado · se borra al verificarte');
      await foto('09-rg9');
      await seguir(p);
      // RG-10 Revisar y mandar: la casilla está sin tildar
      await paso(p, 10);
      assert.equal(await p.getByRole('checkbox', { name: /Leí y acepto/ }).isChecked(), false, 'casilla sin tildar');
      await seguir(p, 'Mandar mi alta');
      await ver(p, 'tenés que aceptar los términos');
      await p.getByRole('checkbox', { name: /Leí y acepto/ }).check();
      await foto('10-rg10');
      await seguir(p, 'Mandar mi alta');
      // D6-Alta: evaluando, sin sello de verificado
      await ver(p, 'Estamos evaluando tu perfil');
      await ver(p, 'Sumar un certificado');
      await foto('11-d6-alta');
      // Operations: cargado no habilita
      await panel(p, 'Tomar el alta en revisión', 'Habilitar');
      await p.getByRole('button', { name: 'Panel de prueba' }).click();
      await ver(p, 'No se puede habilitar');
      await p.keyboard.press('Escape');
      await panel(p, 'Verificar documentos, matrículas y antecedentes', 'Habilitar');
      // OB-Aprobado aparece solo
      await p.waitForURL('**/alta/habilitado/');
      await ver(p, '¡Estás habilitado, Julián!');
      await ver(p, 'Verificado por Handyx');
      await foto('12-ob-aprobado');
      await seguir(p, 'Empezar');
      // OB-Permisos
      await p.waitForURL('**/alta/permisos/');
      await ver(p, 'Nunca en segundo plano');
      await foto('13-ob-permisos');
      await seguir(p, 'Permitir avisos');
      // OB-Tour: tres láminas con botones (no pasan solas)
      await p.waitForURL('**/alta/como-funciona/');
      await ver(p, '1 de 3');
      await foto('14-ob-tour');
      await seguir(p, 'Siguiente');
      await ver(p, 'el que manda es el tuyo');
      await seguir(p, 'Siguiente');
      await ver(p, 'Handyx no te cobra comisión, nunca');
      await seguir(p, 'Ver los primeros pasos');
      // OB-PrimerosPasos
      await p.waitForURL('**/alta/primeros-pasos/');
      await ver(p, 'Ninguna es obligatoria para recibir pedidos');
      await foto('15-ob-primeros-pasos');
      await p.getByRole('link', { name: 'Ir al inicio y ponerme disponible' }).click();
      await p.waitForURL('**/inicio/');
    },
  ],
  [
    'RC-Onboarding-se-retoma-donde-quedo',
    async ({ p, base }) => {
      await p.goto(`${base}/alta/?escenario=incompleto`);
      await paso(p, 4);
      await ver(p, '¿Por dónde');
      // Volver lleva al paso anterior con lo guardado
      await p.getByRole('link', { name: 'Volver al paso anterior' }).click();
      await paso(p, 3);
      assert.equal(await p.getByRole('checkbox', { name: /Plomería/ }).isChecked(), true, 'Plomería ya estaba elegida');
      // No se saltean pasos
      await p.goto(`${base}/alta/?escenario=incompleto&paso=antecedentes`);
      await paso(p, 4);
    },
  ],
  [
    'RC-Onboarding-correccion-pedida',
    async ({ p, base, foto }) => {
      await p.goto(`${base}/alta/?escenario=en_revision`);
      await ver(p, 'Estamos evaluando tu perfil');
      await panel(p, 'Pedir una corrección (selfie)');
      await ver(p, 'Te pedimos un cambio');
      await ver(p, 'La selfie se ve oscura');
      await foto('c1-correccion');
      await p.getByRole('link', { name: 'Corregir: Selfie' }).click();
      await paso(p, 5);
      await ver(p, 'Te pedimos corregir esto');
      await p.getByRole('button', { name: 'Sacar foto de prueba' }).click();
      await p.getByRole('button', { name: 'Usar esta foto' }).click();
      await paso(p, 6);
      await p.goto(`${base}/alta/?escenario=en_revision`).catch(() => undefined);
    },
  ],
];

module.exports = { RECORRIDOS };

// Uso suelto.
if (require.main === module) {
  const { join } = require('node:path');
  const { servir } = require('../servidor.cjs');
  const { chromium } = require('playwright');
  (async () => {
    const srv = await servir();
    const base = `http://localhost:${srv.address().port}`;
    const nav = await chromium.launch();
    const capturas = process.env.CAPTURAS ?? null;
    let mal = 0;
    for (const [nombre, pasos] of RECORRIDOS) {
      if (process.env.SOLO && !nombre.startsWith(process.env.SOLO)) continue;
      const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      p.setDefaultTimeout(8000);
      const errores = [];
      p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
      p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push('CONSOLE ' + m.text()));
      const foto = async (n) => capturas && p.screenshot({ path: join(capturas, `${nombre}-${n}.png`), fullPage: true });
      try {
        await pasos({ p, base, foto });
        assert.deepEqual(errores, [], 'errores de consola');
        console.log(`✔ ${nombre}`);
      } catch (e) {
        mal += 1;
        await p.screenshot({ path: join(capturas ?? '/tmp', `FALLO-${nombre}.png`), fullPage: true }).catch(() => undefined);
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
