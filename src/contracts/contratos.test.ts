import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { formatearPesos, monto, porcion, sumar } from './dinero.ts';
import { avisoFee, POLITICA_FEE_DEMO, politicaVigente, type PoliticaFee } from './fee.ts';
import {
  faltantesParaHabilitar,
  MAQUINA_ALTA,
  MAQUINA_DOCUMENTO,
  MAQUINA_ADICIONAL,
  MAQUINA_PAGO,
  MAQUINA_PEDIDO,
  MAQUINA_PRESENCIAL,
  MAQUINA_PROPUESTA,
  MAQUINA_TRABAJO,
  puedeResponder,
  puedeTransicionar,
  siguientes,
} from './maquinas.ts';
import { RUBROS, requiereMatricula } from './rubros.ts';
import { fechaLocal } from './tiempos.ts';
import { MontoSchema, NuevaPropuestaSchema, PerfilEspecialistaSchema } from './dto.ts';

describe('dinero', () => {
  it('solo acepta centavos enteros no negativos', () => {
    assert.throws(() => monto(10.5));
    assert.throws(() => monto(-1));
    assert.deepEqual(monto(4_500_000), { centavos: 4_500_000, moneda: 'ARS' });
    assert.equal(MontoSchema.safeParse({ centavos: 1.5, moneda: 'ARS' }).success, false);
    assert.equal(MontoSchema.safeParse({ centavos: 100, moneda: 'USD' }).success, false);
  });
  it('fee 0 % da exactamente 0 y los porcentajes redondean al centavo', () => {
    assert.equal(porcion(monto(4_500_000), 0).centavos, 0);
    assert.equal(porcion(monto(4_500_000), 500).centavos, 225_000);
    assert.equal(porcion(monto(333), 1_000).centavos, 33);
    assert.equal(porcion(monto(335), 1_000).centavos, 34); // 33,5 → 34
  });
  it('formatea en pesos como la landing', () => {
    assert.equal(formatearPesos(monto(4_500_000)), '$ 45.000');
    assert.equal(formatearPesos(monto(4_500_050)), '$ 45.000,50');
    assert.equal(formatearPesos(sumar(monto(100), monto(5))), '$ 1,05');
  });
});

describe('fee 0 % de la demo', () => {
  const p = POLITICA_FEE_DEMO;
  it('rige del 10/11 00:00 al 10/12 23:59 en Buenos Aires, con 0 bps', () => {
    assert.equal(politicaVigente(new Date('2026-11-10T02:59:59Z'), [p]), null);
    assert.equal(politicaVigente(new Date('2026-11-10T03:00:00Z'), [p])?.id, p.id);
    assert.equal(politicaVigente(new Date('2026-12-11T02:59:59Z'), [p])?.bpsEspecialista, 0);
    assert.equal(politicaVigente(new Date('2026-12-11T03:00:00Z'), [p]), null);
  });
  it('al terminar no infiere ninguna tarifa, y una política en borrador nunca se aplica', () => {
    const posterior: PoliticaFee = { ...p, id: 'x', estado: 'borrador', desde: p.hastaExclusivo, hastaExclusivo: '2027-12-31T03:00:00.000Z', bpsEspecialista: 1_000 };
    assert.equal(politicaVigente(new Date('2027-01-05T12:00:00Z'), [p, posterior]), null);
  });
  it('el contador cuenta días calendario de Buenos Aires hasta el 10/12', () => {
    assert.deepEqual(avisoFee(new Date('2026-10-29T15:00:00Z'), p), { fase: 'antes', diasParaEmpezar: 12, ultimoDiaLocal: '2026-12-10' });
    const primero = avisoFee(new Date('2026-11-10T03:00:00Z'), p);
    assert.equal(primero.fase === 'vigente' && primero.diasRestantes, 30);
    // 10/12 a las 23:30 en Buenos Aires (02:30Z del 11/12): último día
    const ultimo = avisoFee(new Date('2026-12-11T02:30:00Z'), p);
    assert.equal(ultimo.fase === 'vigente' && ultimo.ultimoDia, true);
    assert.equal(avisoFee(new Date('2026-12-11T03:00:00Z'), p).fase, 'terminada');
  });
  it('fechaLocal usa la zona de Buenos Aires, no UTC', () => {
    assert.equal(fechaLocal(new Date('2026-12-11T02:30:00Z')), '2026-12-10');
  });
});

describe('alta y verificación', () => {
  it('el especialista nunca se verifica ni se habilita a sí mismo', () => {
    for (const desde of MAQUINA_DOCUMENTO.estados) assert.equal(puedeTransicionar(MAQUINA_DOCUMENTO, desde, 'verificado', 'especialista'), false);
    for (const desde of MAQUINA_ALTA.estados) assert.equal(puedeTransicionar(MAQUINA_ALTA, desde, 'habilitada', 'especialista'), false);
    for (const desde of MAQUINA_PRESENCIAL.estados) assert.equal(puedeTransicionar(MAQUINA_PRESENCIAL, desde, 'aprobada', 'especialista'), false);
  });
  it('cargado no equivale a verificado: no se puede saltar la revisión', () => {
    assert.equal(puedeTransicionar(MAQUINA_DOCUMENTO, 'cargado', 'verificado', 'operations'), false);
    assert.deepEqual(siguientes(MAQUINA_DOCUMENTO, 'faltante', 'especialista'), ['cargado']);
  });
  it('faltantes para habilitar solo cuentan verificado / aprobada', () => {
    assert.deepEqual(
      faltantesParaHabilitar({ dni: 'cargado', cuitCuil: 'verificado', fotoCara: 'en_revision', antecedentes: 'cita_coordinada', rubrosHabilitados: 0 }),
      ['dni', 'fotoCara', 'antecedentes', 'rubro'],
    );
    assert.deepEqual(faltantesParaHabilitar({ dni: 'verificado', cuitCuil: 'verificado', fotoCara: 'verificado', antecedentes: 'aprobada', rubrosHabilitados: 1 }), []);
  });
  it('gas y aire acondicionado requieren matrícula', () => {
    assert.deepEqual(RUBROS.filter(requiereMatricula), ['gas', 'aire_acondicionado']);
  });
  it('el perfil no tiene campos para archivos de antecedentes', () => {
    assert.equal('antecedentesArchivo' in PerfilEspecialistaSchema.shape, false);
  });
});

describe('propuestas, pedidos, trabajos y pagos', () => {
  const ahora = new Date('2026-11-17T15:00:00Z');
  const p = { estado: 'pendiente' as const, autorRol: 'especialista' as const, venceEn: '2026-11-17T15:05:00Z' };
  it('solo la contraparte responde, y nunca una propuesta vencida', () => {
    assert.equal(puedeResponder(p, 'usuario', ahora), true);
    assert.equal(puedeResponder(p, 'especialista', ahora), false);
    assert.equal(puedeResponder(p, 'usuario', new Date('2026-11-17T15:05:00Z')), false);
    assert.equal(puedeResponder({ ...p, estado: 'aceptada' }, 'usuario', ahora), false);
  });
  it('una propuesta aceptada no vuelve a cambiar', () => {
    assert.deepEqual(siguientes(MAQUINA_PROPUESTA, 'aceptada', 'usuario'), []);
    assert.deepEqual(siguientes(MAQUINA_PROPUESTA, 'aceptada', 'especialista'), []);
  });
  it('acordar un pedido es efecto de sistema (transacción de aceptación), no de un rol', () => {
    assert.equal(puedeTransicionar(MAQUINA_PEDIDO, 'buscando', 'acordado', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_PEDIDO, 'buscando', 'acordado', 'sistema'), true);
  });
  it('la llegada la marca la geocerca (sistema) o el especialista con "Ya llegué"; nadie más (decisión del 29/10/2026)', () => {
    assert.equal(puedeTransicionar(MAQUINA_TRABAJO, 'en_camino', 'en_sitio', 'especialista'), true);
    assert.equal(puedeTransicionar(MAQUINA_TRABAJO, 'en_camino', 'en_sitio', 'sistema'), true);
    assert.equal(puedeTransicionar(MAQUINA_TRABAJO, 'en_camino', 'en_sitio', 'usuario'), false);
    assert.equal(puedeTransicionar(MAQUINA_TRABAJO, 'agendado', 'en_sitio', 'sistema'), false);
  });
  it('un adicional lo responde solo el usuario; lo retira el especialista o el sistema al terminar', () => {
    assert.equal(puedeTransicionar(MAQUINA_ADICIONAL, 'pendiente', 'aceptado', 'usuario'), true);
    assert.equal(puedeTransicionar(MAQUINA_ADICIONAL, 'pendiente', 'aceptado', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_ADICIONAL, 'pendiente', 'retirado', 'sistema'), true);
    assert.equal(puedeTransicionar(MAQUINA_ADICIONAL, 'aceptado', 'retirado', 'especialista'), false);
  });
  it('un pago reportado no lo verifica quien lo reporta', () => {
    assert.equal(puedeTransicionar(MAQUINA_PAGO, 'reportado', 'verificado', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_PAGO, 'reportado', 'verificado', 'usuario'), false);
    assert.equal(puedeTransicionar(MAQUINA_PAGO, 'pendiente', 'verificado', 'especialista'), false);
  });
  it('una propuesta nueva rechaza montos con decimales y campos extra', () => {
    const base = { pedidoId: crypto.randomUUID(), monto: { centavos: 4_500_000, moneda: 'ARS' }, alcance: 'Cambio de canilla', horario: { inicio: '2026-11-18T13:00:00Z', fin: null }, reemplazaA: null };
    assert.equal(NuevaPropuestaSchema.safeParse(base).success, true);
    assert.equal(NuevaPropuestaSchema.safeParse({ ...base, verificado: true }).success, false);
    assert.equal(NuevaPropuestaSchema.safeParse({ ...base, monto: { centavos: 45000.5, moneda: 'ARS' } }).success, false);
  });
});

// Sincronía con la fuente canónica (handyx-client-be) cuando exista: HANDYX_CONTRATOS=<ruta a su src/contracts>.
describe('sincronía del contrato', () => {
  const ruta = process.env.HANDYX_CONTRATOS;
  it('copia idéntica byte a byte de la fuente canónica', { skip: !ruta && 'HANDYX_CONTRATOS no definido' }, () => {
    for (const archivo of ['version.ts', 'rubros.ts', 'tiempos.ts', 'dinero.ts', 'fee.ts', 'maquinas.ts', 'dto.ts']) {
      assert.equal(readFileSync(new URL(archivo, import.meta.url), 'utf8'), readFileSync(`${ruta}/${archivo}`, 'utf8'), archivo);
    }
  });
});
