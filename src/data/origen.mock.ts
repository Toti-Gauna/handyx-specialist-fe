// Origen de datos de desarrollo y vista previa: fixtures sintéticos en memoria (banner visible).
import type { EspecialistaApi } from './api.ts';
import { crearApiMockConEstado } from './mock/adaptador.ts';
import { crearControles, type ControlesPrueba } from './mock/controles.ts';
import type { AyudasPrueba } from './ayudas.ts';
import { CODIGO_PRUEBA, CREDENCIALES_PRUEBA, CUENTAS_PROVEEDOR_PRUEBA, ESCENARIOS, TOKEN_RECUPERACION_PRUEBA, TOKEN_VENCIDO_PRUEBA, type Escenario } from './mock/estado.ts';

/** `?escenario=` en la URL de entrada elige el escenario inicial (por defecto, habilitado). */
function escenarioInicial(): Escenario {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('escenario');
  return (ESCENARIOS as readonly string[]).includes(q ?? '') ? (q as Escenario) : 'habilitado';
}

const { api: apiMock, estado } = crearApiMockConEstado({ escenario: escenarioInicial() });

// `?falla=red|servidor`: arranca con esa falla activa (capturas y auditoría de las pantallas de error).
const fallaInicial = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('falla');
if (fallaInicial === 'red' || fallaInicial === 'servidor') estado.falla = fallaInicial;

export const api: EspecialistaApi = apiMock;
export const controles: ControlesPrueba | null = crearControles(estado, () => undefined);
/** Para la ayuda de la pantalla de acceso en la vista previa. */
export const credencialesPrueba: { email: string; password: string } | null = CREDENCIALES_PRUEBA;
/** Código, enlaces y cuentas de Google o Apple de prueba (pantallas de cuenta del lote 4.2). */
export const ayudasPrueba: AyudasPrueba | null = {
  codigoEmail: CODIGO_PRUEBA,
  tokenRecuperacion: TOKEN_RECUPERACION_PRUEBA,
  tokenVencido: TOKEN_VENCIDO_PRUEBA,
  cuentasProveedor: CUENTAS_PROVEEDOR_PRUEBA,
};
