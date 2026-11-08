// Mock de ingresos y gastos (lote 2.1, contrato 0.11.0). Emula al servidor: el neto es bruto − gastos (sin tarifa de Handyx:
// nunca le cobra comisión al especialista), lo informado va aparte de lo verificado y los gastos son solo del especialista.
// «Cobrárselo al cliente» crea un adicional pendiente en el trabajo (el cliente lo acepta en el chat). Todo es de PRUEBA.
// El estado propio vive en un WeakMap atado al EstadoMock (sin tocar el estado común).
import { monto } from '../../contracts/dinero.ts';
import { MesSchema } from '../../contracts/comun.ts';
import {
  CambioGastoSchema,
  NuevoGastoSchema,
  NuevoIngresoExternoSchema,
  ResumenIngresosSchema,
  type CategoriaGasto,
  type Cobro,
  type Gasto,
  type IngresoExterno,
  type ResumenIngresos,
} from '../../contracts/ingresos.ts';
import type { Adicional } from '../../contracts/dto.ts';
import { ahoraMs, fallo, idempotente, idFijo, idNuevo, iso, type EstadoMock } from './estado.ts';
import { cobrosDelEstado, mesBA, tituloTrabajo } from './agenda.ts';
import { ID } from './fixtures.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { zodAFallo } from './validacion.ts';

const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FOTO = 5 * 1024 * 1024;
const PAGINA = 20;

interface Extra {
  gastos: Gasto[];
  externos: IngresoExterno[];
}
const extras = new WeakMap<EstadoMock, Extra>();

function sembrado(): Extra {
  const g = (n: number, centavos: number, categoria: CategoriaGasto, descripcion: string, fecha: string, trabajoId: string | null): Gasto => ({
    id: idFijo(0x2200 + n),
    monto: monto(centavos),
    categoria,
    descripcion,
    fecha,
    trabajoId,
    obraId: null,
    origen: 'a_mano',
    ticket: null,
    adicionalId: null,
    creadoEn: `${fecha}T15:00:00.000Z`,
    version: 0,
  });
  return {
    gastos: [
      g(1, 5_200_000, 'materiales', 'Revoque y fijador', '2026-11-12', ID.t4),
      g(2, 1_650_000, 'materiales', 'Térmicas y cable', '2026-11-12', ID.t3),
      g(3, 1_200_000, 'combustible_viaticos', 'Nafta de la semana', '2026-11-10', null),
    ],
    externos: [{ id: idFijo(0x2300 + 1), monto: monto(6_000_000), descripcion: 'Arreglo para un vecino', fecha: '2026-11-09', creadoEn: '2026-11-09T15:00:00.000Z' }],
  };
}

function extra(s: EstadoMock): Extra {
  let e = extras.get(s);
  if (!e) {
    e = sembrado();
    extras.set(s, e);
  }
  return e;
}

const mesValido = (mes: unknown): string => {
  const m = MesSchema.safeParse(mes);
  if (!m.success) throw zodAFallo(m.error);
  return m.data;
};

export function resumenIngresos(s: EstadoMock, mes: unknown): ResumenIngresos {
  const m = mesValido(mes);
  const e = extra(s);
  const cobros = cobrosDelEstado(s).filter((c) => mesBA(Date.parse(c.en)) === m);
  const verificado = cobros.filter((c) => c.estado === 'verificado').reduce((n, c) => n + c.centavos, 0);
  const informado = cobros.filter((c) => c.estado === 'reportado').reduce((n, c) => n + c.centavos, 0);
  const porFuera = e.externos.filter((x) => x.fecha.slice(0, 7) === m).reduce((n, x) => n + x.monto.centavos, 0);
  const gastosMes = e.gastos.filter((x) => x.fecha.slice(0, 7) === m);
  const totalGastos = gastosMes.reduce((n, x) => n + x.monto.centavos, 0);
  const bruto = verificado + informado + porFuera;
  const categorias = new Map<CategoriaGasto, number>();
  for (const x of gastosMes) categorias.set(x.categoria, (categorias.get(x.categoria) ?? 0) + x.monto.centavos);

  // Ganancia por trabajo o etapa: los gastos del trabajo se suman a su primer cobro.
  const grupos = new Map<string, { trabajoId: string; etapaId: string | null; titulo: string; cobrado: number; en: string }>();
  for (const c of cobros) {
    // Los cobros de pasadas de prueba no son un trabajo del estado: cuentan igual, con su propio id.
    const trabajoId = c.trabajoId ?? c.id;
    const clave = `${trabajoId}:${c.etapaId ?? ''}`;
    const g = grupos.get(clave) ?? { trabajoId, etapaId: c.etapaId, titulo: c.titulo, cobrado: 0, en: c.en };
    g.cobrado += c.centavos;
    if (c.en > g.en) g.en = c.en;
    grupos.set(clave, g);
  }
  const yaContados = new Set<string>();
  const porTrabajo = [...grupos.values()]
    .sort((a, b) => b.en.localeCompare(a.en))
    .map((g) => {
      const propios = yaContados.has(g.trabajoId) ? 0 : gastosMes.filter((x) => x.trabajoId === g.trabajoId).reduce((n, x) => n + x.monto.centavos, 0);
      yaContados.add(g.trabajoId);
      const ganancia = g.cobrado - propios;
      return {
        trabajoId: g.trabajoId,
        etapaId: g.etapaId,
        titulo: g.titulo,
        cobrado: monto(g.cobrado),
        gastos: monto(propios),
        ganancia: ganancia >= 0 ? monto(ganancia) : null,
        perdida: ganancia < 0 ? monto(-ganancia) : null,
      };
    });

  const neto = bruto - totalGastos;
  return ResumenIngresosSchema.parse({
    mes: m,
    bruto: { total: monto(bruto), enHandyxVerificado: monto(verificado), enHandyxInformado: monto(informado), porFuera: monto(porFuera) },
    gastos: { total: monto(totalGastos), porCategoria: [...categorias].map(([categoria, c]) => ({ categoria, total: monto(c) })) },
    neto: neto >= 0 ? monto(neto) : null,
    perdida: neto < 0 ? monto(-neto) : null,
    porTrabajo,
  });
}

function pagina<T>(lista: T[], cursor?: string | null): { items: T[]; siguienteCursor: string | null } {
  const desde = cursor ? Number(cursor) : 0;
  if (!Number.isInteger(desde) || desde < 0) throw fallo('validacion', 400, 'validacion', 'El cursor no es válido.');
  return { items: lista.slice(desde, desde + PAGINA), siguienteCursor: desde + PAGINA < lista.length ? String(desde + PAGINA) : null };
}

export const ingresos = (s: EstadoMock) => ({
  resumenIngresos: (mes: unknown) => resumenIngresos(s, mes),

  cobrosDelMes(mes: unknown, cursor?: string | null): { items: Cobro[]; siguienteCursor: string | null } {
    const m = mesValido(mes);
    const lista = s.pagos
      .filter((p) => mesBA(Date.parse(p.actualizadoEn)) === m)
      .sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn))
      .map<Cobro>((p) => ({
        id: p.id,
        trabajoId: p.trabajoId,
        etapaId: p.etapaId,
        descripcion: p.descripcion,
        monto: p.monto,
        informado: p.estado === 'pendiente' ? null : p.monto,
        metodo: p.estado === 'pendiente' ? null : p.metodo,
        estado: p.estado,
        fuenteConfirmacion: p.fuenteConfirmacion,
        actualizadoEn: p.actualizadoEn,
        version: 0,
      }));
    return pagina(lista, cursor);
  },

  gastos(filtro: { mes?: string; trabajoId?: string; cursor?: string | null } = {}): { items: Gasto[]; siguienteCursor: string | null } {
    const mes = filtro.mes === undefined ? null : mesValido(filtro.mes);
    const lista = extra(s)
      .gastos.filter((g) => (mes === null || g.fecha.slice(0, 7) === mes) && (filtro.trabajoId === undefined || g.trabajoId === filtro.trabajoId))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn));
    return pagina(lista, filtro.cursor);
  },

  cargarGasto(nuevo: unknown, ticket: unknown, clave: string): Gasto {
    return idempotente(s, `gasto:${clave}`, () => {
      const ok = NuevoGastoSchema.safeParse(nuevo);
      if (!ok.success) throw zodAFallo(ok.error);
      const d = ok.data;
      if (ticket !== null && ticket !== undefined) {
        if (!(ticket instanceof Blob) || !TIPOS_FOTO.has(ticket.type)) throw fallo('validacion', 415, 'tipo_archivo_prohibido', 'Mandá una foto (JPEG, PNG o WebP).');
        if (ticket.size > MAX_FOTO) throw fallo('limite', 413, 'limite', 'La foto pesa más de 5 MB.');
      }
      const t = d.trabajoId ? s.trabajos.find((x) => x.trabajo.id === d.trabajoId) : undefined;
      if (d.trabajoId && !t) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese trabajo.');
      let adicionalId: string | null = null;
      if (d.cobrarAlCliente && t) {
        if (t.trabajo.estado !== 'en_curso') throw fallo('conflicto', 409, 'transicion_invalida', 'Se lo podés cobrar al cliente con el trabajo en curso.');
        const etapa = t.trabajo.tipo === 'obra' ? t.etapas.find((e) => e.estado === 'en_curso') : undefined;
        if (t.trabajo.tipo === 'obra' && !etapa) throw fallo('validacion', 400, 'validacion', 'Elegí la etapa en curso.');
        const a: Adicional = {
          id: idNuevo(s),
          trabajoId: t.trabajo.id,
          etapaId: etapa?.id ?? null,
          tipo: 'repuesto',
          descripcion: d.descripcion?.trim() || `Gasto · ${tituloTrabajo(t)}`,
          monto: d.monto,
          estado: 'pendiente',
          creadoEn: iso(ahoraMs(s)),
          respondidoEn: null,
          version: 0,
        };
        t.adicionales.push(a);
        adicionalId = a.id;
      }
      const gasto: Gasto = {
        id: idNuevo(s),
        monto: d.monto,
        categoria: d.categoria,
        descripcion: d.descripcion,
        fecha: d.fecha,
        trabajoId: d.trabajoId,
        obraId: t?.trabajo.tipo === 'obra' ? t.trabajo.id : null,
        origen: 'a_mano',
        ticket: ticket ? { id: idNuevo(s), url: FOTO_PRUEBA } : null,
        adicionalId,
        creadoEn: iso(ahoraMs(s)),
        version: 0,
      };
      // Solo se suma a tus gastos si lo pediste: «solo cobrárselo al cliente» no baja tu neto.
      if (d.registrarGasto) extra(s).gastos.push(gasto);
      return structuredClone(gasto);
    });
  },

  corregirGasto(id: string, cambio: unknown): Gasto {
    const ok = CambioGastoSchema.safeParse(cambio);
    if (!ok.success) throw zodAFallo(ok.error);
    const g = extra(s).gastos.find((x) => x.id === id);
    if (!g) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese gasto.');
    if (ok.data.version !== g.version) throw fallo('conflicto', 409, 'conflicto_version', 'El gasto cambió. Volvé a cargarlo.');
    for (const [campo, valor] of Object.entries(ok.data)) if (campo !== 'version' && valor !== undefined) Object.assign(g, { [campo]: valor });
    g.version += 1;
    return structuredClone(g);
  },

  borrarGasto(id: string): void {
    const e = extra(s);
    const i = e.gastos.findIndex((x) => x.id === id);
    if (i < 0) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese gasto.');
    e.gastos.splice(i, 1);
  },

  ingresosExternos: (mes: unknown): IngresoExterno[] => {
    const m = mesValido(mes);
    return structuredClone(extra(s).externos.filter((x) => x.fecha.slice(0, 7) === m));
  },

  cargarIngresoExterno(nuevo: unknown, clave: string): IngresoExterno {
    return idempotente(s, `ingreso-externo:${clave}`, () => {
      const ok = NuevoIngresoExternoSchema.safeParse(nuevo);
      if (!ok.success) throw zodAFallo(ok.error);
      const x: IngresoExterno = { id: idNuevo(s), ...ok.data, creadoEn: iso(ahoraMs(s)) };
      extra(s).externos.push(x);
      return structuredClone(x);
    });
  },

  borrarIngresoExterno(id: string): void {
    const e = extra(s);
    const i = e.externos.findIndex((x) => x.id === id);
    if (i < 0) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese cobro.');
    e.externos.splice(i, 1);
  },
});
