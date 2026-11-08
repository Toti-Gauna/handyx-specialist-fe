// Bandeja de avisos (lote 1.4): agrupa por día ("Hoy", "Esta semana", "Antes") y dice la hora o el día de cada uno.
// Lógica pura, con su prueba. Las fechas se miran en hora de Buenos Aires.
import { RUTAS } from '../app/rutas.ts';
import type { AvisoBandeja } from '../contracts/cuenta.ts';
import { diaLocal, fechaHora, hora } from './formato.ts';

export type GrupoAviso = 'hoy' | 'semana' | 'antes';
export const TITULO_GRUPO: Record<GrupoAviso, string> = { hoy: 'Hoy', semana: 'Esta semana', antes: 'Antes' };

const DIA_MS = 86_400_000;
const dias = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DIA_MS;

/** Días enteros (de calendario) que pasaron entre el aviso y ahora. */
export const diasDeDistancia = (creadoEn: string, ahora: Date): number => dias(diaLocal(ahora.toISOString())) - dias(diaLocal(creadoEn));

export function grupoDeAviso(creadoEn: string, ahora: Date): GrupoAviso {
  const d = diasDeDistancia(creadoEn, ahora);
  return d <= 0 ? 'hoy' : d < 7 ? 'semana' : 'antes';
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

/** "17:40" si es de hoy; "Lun" si es de esta semana; "12/11" si es más viejo. */
export function momentoDeAviso(creadoEn: string, ahora: Date): string {
  const g = grupoDeAviso(creadoEn, ahora);
  if (g === 'hoy') return hora(creadoEn);
  const [anio = '0', mes = '0', dia = '0'] = diaLocal(creadoEn).split('-');
  if (g === 'semana') return DIAS_CORTOS[new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia))).getUTCDay()] ?? '';
  return `${dia}/${mes}`;
}

/** Los grupos que tienen avisos, de más nuevo a más viejo. */
export function agruparAvisos(items: readonly AvisoBandeja[], ahora: Date): Array<{ grupo: GrupoAviso; items: AvisoBandeja[] }> {
  const orden = [...items].sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn));
  return (['hoy', 'semana', 'antes'] as const)
    .map((grupo) => ({ grupo, items: orden.filter((a) => grupoDeAviso(a.creadoEn, ahora) === grupo) }))
    .filter((g) => g.items.length > 0);
}

/** «hoy 17:40» si es de hoy; si no, «mar 17/11 · 12:00». Para «Entró …» en sesiones y dispositivos. */
export function textoIngreso(iso: string, ahora: Date): string {
  return grupoDeAviso(iso, ahora) === 'hoy' && diasDeDistancia(iso, ahora) === 0 ? `hoy ${hora(iso)}` : fechaHora(iso);
}

/**
 * A dónde lleva un aviso: siempre a su detalle, nunca acepta nada. Los destinos de pantallas que llegan en olas
 * posteriores (presupuestos, repuestos, camino…) caen en la pantalla madre que ya existe.
 */
export function destinoAviso(d: AvisoBandeja['destino']): string {
  const q = d.id ? `?id=${d.id}` : '';
  switch (d.ruta) {
    case 'pedido':
      return `${RUTAS.pedido.ruta}${q}`;
    case 'trabajo':
      return `${RUTAS.trabajo.ruta}${q}`;
    case 'chat':
      return `${RUTAS.hilo.ruta}${q}`;
    case 'soporte':
      return `${RUTAS.casoSoporte.ruta}${q}`;
    case 'cobros':
      return RUTAS.caja.ruta;
    case 'registro':
      return RUTAS.alta.ruta;
    case 'obra':
    case 'busqueda':
      return RUTAS.trabajos.ruta;
    case 'presupuesto':
    case 'repuestos':
    case 'reparto':
    case 'pedido_ferreteria':
      return RUTAS.taller.ruta;
    case 'cuenta':
    case 'camino':
    case 'premio':
      return RUTAS.cuenta.ruta;
  }
}
