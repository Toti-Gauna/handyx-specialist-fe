// A dónde va una cuenta según su estado (lo decide el servidor): la usan la Puerta, Entrar, Verificar y Aceptar.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../app/rutas.ts';

export async function destinoCuenta(): Promise<string> {
  const sesion = await api.sesion();
  if (!sesion) return RUTAS.bienvenida.ruta;
  if (!sesion.cuenta.emailVerificado) return RUTAS.verificar.ruta;
  if (!sesion.cuenta.terminosAceptados) return RUTAS.aceptar.ruta;
  const perfil = await api.perfil();
  if (perfil.baja && perfil.baja !== 'cancelada') return RUTAS.baja.ruta;
  return perfil.estadoAlta === 'habilitada' ? RUTAS.inicio.ruta : RUTAS.alta.ruta;
}
