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
  if (perfil.estadoAlta !== 'habilitada') return RUTAS.alta.ruta;
  // Recién habilitada: la primera vez se abre sola la bienvenida (OB-Aprobado). Si no se puede saber, va al Inicio.
  const onboarding = await api.onboarding().catch(() => null);
  return onboarding && !onboarding.bienvenidaVista ? RUTAS.obHabilitado.ruta : RUTAS.inicio.ruta;
}
