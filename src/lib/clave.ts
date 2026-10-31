// Medidor de contraseña (lote 4.2). Ayuda a elegir; la regla que manda es la del servidor (REGLAS_CLAVE).
import { REGLAS_CLAVE } from '../contracts/dto.ts';

export interface FuerzaClave {
  /** 0: no alcanza el mínimo · 1: aceptable · 2: buena · 3: muy buena. */
  nivel: 0 | 1 | 2 | 3;
  texto: string;
  /** Un consejo concreto para mejorarla, o null si ya está bien. */
  consejo: string | null;
}

const TIPOS = [/[a-zñáéíóú]/, /[A-ZÑÁÉÍÓÚ]/, /\d/, /[^\wñáéíóúÑÁÉÍÓÚ]/];

export function fuerzaClave(clave: string, email = ''): FuerzaClave {
  if (clave.length < REGLAS_CLAVE.minimo) {
    const faltan = REGLAS_CLAVE.minimo - clave.length;
    return { nivel: 0, texto: 'Muy corta', consejo: `Te ${faltan === 1 ? 'falta 1 carácter' : `faltan ${faltan} caracteres`}. Una frase es fácil de recordar.` };
  }
  const usuario = email.split('@')[0]?.toLowerCase() ?? '';
  if (usuario.length >= 4 && clave.toLowerCase().includes(usuario)) {
    return { nivel: 1, texto: 'Aceptable', consejo: 'No uses tu email dentro de la contraseña.' };
  }
  const tipos = TIPOS.filter((t) => t.test(clave)).length;
  if (clave.length >= 20 && tipos >= 2) return { nivel: 3, texto: 'Muy buena', consejo: null };
  if (clave.length >= 16 || tipos >= 3) return { nivel: 2, texto: 'Buena', consejo: clave.length < 16 ? 'Más larga es todavía mejor.' : null };
  return { nivel: 1, texto: 'Aceptable', consejo: 'Sumá palabras o números para hacerla más fuerte.' };
}
