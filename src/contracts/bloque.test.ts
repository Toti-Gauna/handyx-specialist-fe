// Reglas del contrato 0.11.0 (bloque Taller): máquinas nuevas, reglas puras y lo que las respuestas nunca traen.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { faltaParaHito, MAQUINA_CANJE, MAQUINA_HITO } from './camino.ts';
import { MensajeChatSchema, REACCIONES, ReaccionSchema } from './chat.ts';
import { bpsDeParte, BusquedaSchema, MAQUINA_BUSQUEDA, MAQUINA_POSTULACION, repartoCuadra } from './equipo.ts';
import { MAQUINA_PEDIDO_FERRETERIA } from './ferreterias.ts';
import { InformeCobroSchema, NuevoGastoSchema } from './ingresos.ts';
import { BusquedaMapaSchema, PedidoEnMapaSchema, PedidoEntranteSchema } from './mapa.ts';
import { esFinal, puedeTransicionar, siguientes } from './maquinas.ts';
import { MAQUINA_CONFORMIDAD } from './modo-trabajo.ts';
import { MAQUINA_OBRA } from './obras.ts';
import { AgregarMaterialSchema, MAQUINA_PRESUPUESTO, NuevoPresupuestoSchema } from './presupuestos.ts';
import { faltantesHabilitacion, RegistroEspecialistaSchema, rubrosHabilitables, type RequisitosRegistro } from './registro.ts';
import { MAQUINA_REPUESTO } from './repuestos.ts';
import { ReautenticacionSchema, ResultadoIngresoSchema } from './seguridad.ts';

const id = () => crypto.randomUUID();
const ars = (centavos: number) => ({ centavos, moneda: 'ARS' as const });

describe('registro y verificación (0.11.0)', () => {
  const verificado: RequisitosRegistro = {
    selfie: 'verificado',
    dniFrente: 'verificado',
    dniDorso: 'verificado',
    cuitCuil: 'verificado',
    antecedentes: 'verificado',
    rubros: [{ rubro: 'plomeria', matricula: null }],
  };
  it('solo cuenta lo verificado: cargado no habilita', () => {
    assert.deepEqual(faltantesHabilitacion(verificado), []);
    assert.deepEqual(faltantesHabilitacion({ ...verificado, antecedentes: 'cargado', dniDorso: 'en_revision' }), ['dni', 'antecedentes']);
  });
  it('Gas y Aire acondicionado no se habilitan sin la matrícula verificada', () => {
    const r: RequisitosRegistro = { ...verificado, rubros: [{ rubro: 'gas', matricula: 'cargado' }, { rubro: 'aire_acondicionado', matricula: null }] };
    assert.deepEqual(rubrosHabilitables(r), []);
    assert.deepEqual(faltantesHabilitacion(r), ['rubro']);
    assert.deepEqual(rubrosHabilitables({ ...r, rubros: [{ rubro: 'gas', matricula: 'verificado' }] }), ['gas']);
  });
  it('el registro nunca devuelve el domicilio, los números completos ni la URL de un archivo sensible', () => {
    const forma = RegistroEspecialistaSchema.shape;
    assert.deepEqual(Object.keys(forma.domicilio.shape).sort(), ['barrio', 'cargado']);
    assert.equal('url' in forma.antecedentes.shape, false);
    assert.equal('numero' in forma.dni.shape, false);
    assert.ok('archivoBorrado' in forma.antecedentes.shape);
  });
});

describe('acceso y segunda verificación (0.11.0)', () => {
  it('el ingreso devuelve la sesión o el paso 2, nunca las dos cosas', () => {
    const desafio = { desafio: 'x'.repeat(16), metodos: ['totp', 'respaldo'], preferido: 'totp', telefonoEnmascarado: null, emailEnmascarado: null, venceEn: '2026-11-17T21:10:00Z' };
    assert.equal(ResultadoIngresoSchema.safeParse({ estado: 'segunda_verificacion', desafio }).success, true);
    assert.equal(ResultadoIngresoSchema.safeParse({ estado: 'sesion', desafio }).success, false);
  });
  it('para un cambio sensible se manda la contraseña o un código, uno solo', () => {
    assert.equal(ReautenticacionSchema.safeParse({ password: 'una-clave-larga', codigo: null }).success, true);
    assert.equal(ReautenticacionSchema.safeParse({ password: null, codigo: '123456' }).success, true);
    assert.equal(ReautenticacionSchema.safeParse({ password: 'una-clave-larga', codigo: '123456' }).success, false);
    assert.equal(ReautenticacionSchema.safeParse({ password: null, codigo: null }).success, false);
  });
});

describe('mapa de arreglos (0.11.0)', () => {
  it('un pedido del mapa no trae dirección, punto exacto ni tiempo de llegada', () => {
    for (const forma of [PedidoEnMapaSchema.shape, PedidoEntranteSchema.shape]) {
      for (const prohibido of ['direccion', 'destino', 'punto', 'llegadaEstimada', 'telefono', 'cliente']) assert.equal(prohibido in forma, false, prohibido);
    }
  });
  it('«me voy hasta…» manda la posición en el cuerpo y es opcional', () => {
    assert.equal(BusquedaMapaSchema.safeParse({ referencia: { tipo: 'destino', destinoId: 'batan' }, desde: null }).success, true);
    assert.equal(BusquedaMapaSchema.safeParse({ referencia: { tipo: 'mis_zonas' } }).success, false);
  });
});

describe('máquinas del bloque (0.11.0)', () => {
  it('el especialista no acepta su propio presupuesto ni aprueba sus repuestos', () => {
    for (const desde of MAQUINA_PRESUPUESTO.estados) assert.equal(puedeTransicionar(MAQUINA_PRESUPUESTO, desde, 'aceptado', 'especialista'), false);
    for (const desde of MAQUINA_REPUESTO.estados) assert.equal(puedeTransicionar(MAQUINA_REPUESTO, desde, 'aprobado', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_REPUESTO, 'esperando_aprobacion', 'aprobado', 'usuario'), true);
  });
  it('una versión enviada no se edita: la reemplaza el sistema al mandar otra', () => {
    assert.deepEqual(siguientes(MAQUINA_PRESUPUESTO, 'enviado', 'especialista'), []);
    assert.equal(puedeTransicionar(MAQUINA_PRESUPUESTO, 'enviado', 'reemplazado', 'sistema'), true);
    assert.equal(esFinal(MAQUINA_PRESUPUESTO, 'aceptado'), true);
  });
  it('la conformidad la da solo el cliente; la obra la acepta solo el cliente', () => {
    assert.equal(puedeTransicionar(MAQUINA_CONFORMIDAD, 'esperando', 'dada', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_CONFORMIDAD, 'esperando', 'dada', 'usuario'), true);
    assert.equal(puedeTransicionar(MAQUINA_OBRA, 'propuesta_enviada', 'aceptada', 'especialista'), false);
  });
  it('el retiro en la ferretería lo marca solo la ferretería (QR de un uso)', () => {
    for (const actor of ['especialista', 'usuario', 'operations', 'sistema'] as const) {
      assert.equal(puedeTransicionar(MAQUINA_PEDIDO_FERRETERIA, 'listo', 'retirado', actor), false);
    }
    assert.equal(puedeTransicionar(MAQUINA_PEDIDO_FERRETERIA, 'listo', 'retirado', 'ferreteria'), true);
    assert.equal(puedeTransicionar(MAQUINA_PEDIDO_FERRETERIA, 'enviado', 'confirmado', 'especialista'), false);
  });
  it('un premio no se libera sin la revisión de Operations; un canje lo entrega Operations', () => {
    assert.deepEqual(siguientes(MAQUINA_HITO, 'en_revision', 'especialista'), []);
    assert.equal(puedeTransicionar(MAQUINA_HITO, 'en_revision', 'disponible', 'operations'), true);
    assert.equal(puedeTransicionar(MAQUINA_HITO, 'pendiente', 'alcanzado', 'especialista'), false);
    assert.equal(puedeTransicionar(MAQUINA_CANJE, 'listo', 'entregado', 'especialista'), false);
  });
  it('una búsqueda cierra sola y nadie entra a la obra sin que lo elijan', () => {
    assert.equal(puedeTransicionar(MAQUINA_BUSQUEDA, 'abierta', 'cerrada', 'sistema'), true);
    assert.equal(puedeTransicionar(MAQUINA_POSTULACION, 'postulada', 'elegida', 'sistema'), false);
    const b = { id: id(), obraId: id(), rubro: 'electricidad', jornadas: [6], parte: ars(8_500_000), soloVerificados: false, requiereMatricula: true, mensaje: '', estado: 'abierta', cierraEn: '2026-11-18T21:00:00Z', postulantes: 0, creadaEn: '2026-11-17T21:00:00Z' };
    assert.equal(BusquedaSchema.safeParse(b).success, false, 'verificado por Handyx no se puede apagar');
    assert.equal(BusquedaSchema.safeParse({ ...b, soloVerificados: true }).success, true);
  });
});

describe('plata del bloque (0.11.0)', () => {
  it('el reparto cuadra al centavo y el porcentaje es solo para mostrar', () => {
    assert.equal(repartoCuadra(85_000_000, [51_000_000, 25_500_000, 8_500_000]), true);
    assert.equal(repartoCuadra(85_000_000, [51_000_000, 25_500_000, 8_499_999]), false);
    assert.equal(repartoCuadra(100, [50.5, 49.5]), false);
    assert.equal(bpsDeParte(51_000_000, 85_000_000), 6_000);
    assert.equal(bpsDeParte(1, 3), 3_333);
    assert.equal(bpsDeParte(2, 3), 6_667);
  });
  it('un gasto pide al menos una casilla, y cobrárselo al cliente exige el trabajo', () => {
    const g = { monto: ars(1_300_000), categoria: 'materiales', descripcion: null, fecha: '2026-11-17', trabajoId: null, registrarGasto: true, cobrarAlCliente: false };
    assert.equal(NuevoGastoSchema.safeParse(g).success, true);
    assert.equal(NuevoGastoSchema.safeParse({ ...g, registrarGasto: false }).success, false);
    assert.equal(NuevoGastoSchema.safeParse({ ...g, cobrarAlCliente: true }).success, false);
    assert.equal(NuevoGastoSchema.safeParse({ ...g, cobrarAlCliente: true, trabajoId: id() }).success, true);
  });
  it('informar un cobro admite la transferencia y nunca un importe en cero', () => {
    assert.equal(InformeCobroSchema.safeParse({ metodo: 'transferencia', monto: ars(4_700_000), version: 1 }).success, true);
    assert.equal(InformeCobroSchema.safeParse({ metodo: 'efectivo', monto: ars(0), version: 1 }).success, false);
  });
  it('un presupuesto va atado a una sola cosa y un material a mano trae nombre, unidad y precio', () => {
    assert.equal(NuevoPresupuestoSchema.safeParse({ pedidoId: id(), trabajoId: null, obraId: null, titulo: 'Canilla', plantillaId: null }).success, true);
    assert.equal(NuevoPresupuestoSchema.safeParse({ pedidoId: id(), trabajoId: id(), obraId: null, titulo: 'Canilla', plantillaId: null }).success, false);
    const m = { precioId: null, nombre: 'Flexible 40 cm', unidad: 'unidad', precioUnitario: ars(160_000), cantidad: 2, modoPrecio: 'fijo', cobrarAlCliente: true, registrarGasto: true };
    assert.equal(AgregarMaterialSchema.safeParse(m).success, true);
    assert.equal(AgregarMaterialSchema.safeParse({ ...m, precioUnitario: null }).success, false);
    assert.equal(AgregarMaterialSchema.safeParse({ ...m, cantidad: 2.0005 }).success, false);
  });
  it('el camino nunca resta: lo que falta no da negativo', () => {
    assert.deepEqual(faltaParaHito({ trabajos: 8, montoCentavos: 0 }, { trabajos: 10, montoCentavos: null }), { trabajos: 2, montoCentavos: 0, alcanzado: false });
    assert.deepEqual(faltaParaHito({ trabajos: 12, montoCentavos: 30_000_000 }, { trabajos: 10, montoCentavos: 25_000_000 }), { trabajos: 0, montoCentavos: 0, alcanzado: true });
  });
});

describe('chat (0.11.0)', () => {
  const base = {
    id: id(), chatId: id(), autor: { miembroId: id(), nombre: 'Sofía Ruiz', iniciales: 'SR', rol: 'profesional', esVos: false },
    tipo: 'texto', texto: null, media: [], tarjeta: null, respondeA: null, reacciones: [], editadoEn: null,
    borrado: true, fijado: false, enviadoEn: '2026-11-17T19:02:00Z', vistoPorTodos: true,
  };
  it('un mensaje borrado para todos nunca trae su contenido (queda oculto en el servidor)', () => {
    assert.equal(MensajeChatSchema.safeParse(base).success, true);
    assert.equal(MensajeChatSchema.safeParse({ ...base, texto: 'Mañana arranco 8:30' }).success, false);
  });
  it('las reacciones son de una lista cerrada', () => {
    assert.equal(REACCIONES.length, 5);
    assert.equal(ReaccionSchema.safeParse({ emoji: '👍' }).success, true);
    assert.equal(ReaccionSchema.safeParse({ emoji: '💩' }).success, false);
  });
});
