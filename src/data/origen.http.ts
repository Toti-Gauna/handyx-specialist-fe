// Origen de datos de producción: api-especialista. No importa nada del mock (ni fixtures).
import { entorno } from '../config/entorno.ts';
import type { EspecialistaApi } from './api.ts';
import { crearApiHttp } from './http/adaptador.ts';

if (entorno.origen !== 'http') throw new Error('origen.http.ts requiere NEXT_PUBLIC_DATA_SOURCE=http');

export const api: EspecialistaApi = crearApiHttp({ baseUrl: entorno.apiBaseUrl });
