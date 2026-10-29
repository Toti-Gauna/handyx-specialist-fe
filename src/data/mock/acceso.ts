import { IngresoSchema, RegistroSchema, type Sesion } from '../../contracts/dto.ts';
import { fallo, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const MAX_INTENTOS = 5;

export function sesionActual(s: EstadoMock): Sesion | null {
  if (!s.sesionActiva || s.sesionExpirada) {
    s.sesionActiva = false;
    return null;
  }
  return {
    cuenta: { id: s.cuenta.id, roles: ['especialista'] },
    csrfToken: 'mock-csrf-solo-en-memoria',
    expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export const acceso = (s: EstadoMock) => ({
  sesion: () => sesionActual(s),
  ingresar(datos: unknown): Sesion {
    const ok = IngresoSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    if (s.intentosFallidos >= MAX_INTENTOS) throw fallo('limite', 429, 'limite', 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.');
    if (s.cuentas.get(ok.data.email.toLowerCase()) !== ok.data.password) {
      s.intentosFallidos += 1;
      throw fallo('sesion', 401, 'no_autenticado', 'El email o la contraseña no son correctos.');
    }
    s.intentosFallidos = 0;
    s.sesionActiva = true;
    s.sesionExpirada = false;
    s.cuenta.email = ok.data.email.toLowerCase();
    s.perfil.email = s.cuenta.email;
    return sesionActual(s) as Sesion;
  },
  // Respuesta neutra: igual si el email ya tenía cuenta. Solo una cuenta nueva queda con sesión abierta.
  registrar(datos: unknown): void {
    const ok = RegistroSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const email = ok.data.email.toLowerCase();
    if (s.cuentas.has(email)) return;
    s.cuentas.set(email, ok.data.password);
    s.cuenta.email = email;
    s.perfil.email = email;
    s.sesionActiva = true;
    s.sesionExpirada = false;
  },
  recuperar(email: string): void {
    void email; // respuesta neutra: no se revela si la cuenta existe
  },
  salir(): void {
    s.sesionActiva = false;
  },
});
