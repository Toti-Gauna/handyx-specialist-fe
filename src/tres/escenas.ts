// Escenas listas para el Visor3D (lote 0.3): cada función devuelve un `montar` que arma la primitiva, la encuadra y
// la anima respetando «reducir movimiento». Las pantallas solo eligen la escena y escriben la descripción en texto.
// Memorizá el resultado (useMemo) para que la escena no se rearme en cada render.
import type { Rubro } from '../contracts/rubros.ts';
import type { FaseRegalo } from './regalo.ts';
import type { MontarEscena } from './motor.ts';
import { crearArreglo, reproducirArreglo } from './primitivas/arreglo3d.ts';
import { crearAnilloTomas, crearObjetoEscaneado, TERMOTANQUE_EJEMPLO, type MedidasTermotanque } from './primitivas/escaneo3d.ts';
import { crearCajaRegalo, reproducirRegalo } from './primitivas/regalo3d.ts';
import { crearSendero } from './primitivas/sendero3d.ts';
import type { Estacion } from './sendero.ts';
import type * as THREE from 'three';

/** El arreglo del rubro que se construye en un rincón isométrico. Usalo con `vista="isometrica"`. */
export function escenaArreglo(rubro: Rubro, o: { alAvanzar?: (armadas: number, total: number) => void; armado?: boolean } = {}): MontarEscena {
  return (ctx) => {
    const a = crearArreglo(rubro, ctx.materiales, ctx.presupuesto, { armado: o.armado });
    ctx.raiz.add(a.grupo);
    ctx.encuadrar(a.foco.centro, a.foco.radio);
    if (o.armado) return;
    return reproducirArreglo(a, ctx, o.alAvanzar);
  };
}

/**
 * La caja de regalo que baja, tiembla y se abre (sin azar: el premio ya se anunció). `premio` arma lo que aparece
 * adentro (un modelo nativo); `alCambiarFase` sirve para los papelitos (useConfeti) al abrir.
 */
export function escenaRegalo(o: { premio?: () => THREE.Object3D; alCambiarFase?: (f: FaseRegalo) => void } = {}): MontarEscena {
  return (ctx) => {
    const lado = 0.6;
    const caja = crearCajaRegalo(ctx.materiales, ctx.presupuesto, lado);
    const premio = o.premio?.();
    if (premio) caja.hueco.add(premio);
    ctx.raiz.add(caja.grupo);
    // Se encuadra la caja apoyada con lugar para la tapa abierta (no la caída desde arriba).
    ctx.encuadrar([0, lado * 0.75, 0], lado * 1.45);
    return reproducirRegalo(caja, ctx, o.alCambiarFase);
  };
}

/** El camino de trabajos con sus estaciones; la cámara mira la estación en curso. Usalo con `vista="isometrica"`. */
export function escenaSendero(estaciones: readonly Estacion[], o: { avance?: number } = {}): MontarEscena {
  return (ctx) => {
    const s = crearSendero(ctx.materiales, ctx.presupuesto, estaciones, { avance: o.avance });
    ctx.raiz.add(s.grupo);
    ctx.encuadrar(s.foco.centro, s.foco.radio);
  };
}

/** El objeto escaneado de ejemplo con sus cotas y, si se pide, el anillo de fotos (T-Escanear / T-Modelo3D). */
export function escenaEscaneado(o: { medidas?: MedidasTermotanque; cotas?: boolean; tomadas?: number; anillo?: boolean } = {}): MontarEscena {
  return (ctx) => {
    const medidas = o.medidas ?? TERMOTANQUE_EJEMPLO;
    const obj = crearObjetoEscaneado(ctx.materiales, ctx.presupuesto, medidas);
    obj.cotas.visible = o.cotas !== false;
    ctx.raiz.add(obj.grupo);
    if (o.anillo) ctx.raiz.add(crearAnilloTomas(ctx.materiales, { tomadas: o.tomadas, radio: medidas.diametroM * 1.3, altura: medidas.altoM * 0.55 }).grupo);
  };
}
