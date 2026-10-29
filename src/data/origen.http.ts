// Origen de datos de producción: api-especialista. No importa nada del mock (ni fixtures ni panel de prueba).
import { entorno } from '../config/entorno.ts';
import type { EspecialistaApi } from './api.ts';
import { crearApiHttp } from './http/adaptador.ts';
import type { AyudasPrueba, CamaraPrueba } from './ayudas.ts';
import { fuenteNavegador, type FuenteUbicacion } from '../lib/ubicacion.ts';
import type { ControlesPrueba } from './mock/controles.ts';

if (entorno.origen !== 'http') throw new Error('origen.http.ts requiere NEXT_PUBLIC_DATA_SOURCE=http');

export const api: EspecialistaApi = crearApiHttp({ baseUrl: entorno.apiBaseUrl });
export const controles: ControlesPrueba | null = null;
export const credencialesPrueba: { email: string; password: string } | null = null;
export const ayudasPrueba: AyudasPrueba | null = null;
export const ubicacion: FuenteUbicacion = fuenteNavegador();
export const camaraPrueba: CamaraPrueba | null = null;
