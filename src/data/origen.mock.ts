// Origen de datos de desarrollo y vista previa: fixtures sintéticos en memoria (banner visible).
import type { EspecialistaApi } from './api.ts';
import { crearApiMock } from './mock/adaptador.ts';

export const api: EspecialistaApi = crearApiMock();
