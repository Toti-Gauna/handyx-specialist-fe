// Mock del Taller · IA (0.10.0). Emula al servidor: valida la entrada como él, rechaza lo que no es imagen y devuelve
// propuestas simuladas (la pantalla aclara que en datos de prueba el resultado es simulado). Nada se guarda.
import { PresupuestoDictadoSchema, type PresupuestoSugerido, type SugerenciaTablero } from '../../contracts/dto.ts';
import { presupuestoElectrico } from '../../taller/dictado.ts';
import { fallo } from './estado.ts';
import { zodAFallo } from './validacion.ts';

const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FOTO = 5 * 1024 * 1024;

/** Lo que «ve» la IA simulada: un tablero típico de casa, con una protección que no se pudo leer bien. */
const TABLERO_SIMULADO: SugerenciaTablero = {
  dispositivos: [
    { tipo: 'termica_2p', calibre: 40, circuito: 'General', confianza: 'alta' },
    { tipo: 'diferencial_2p', calibre: 40, circuito: '', confianza: 'alta' },
    { tipo: 'termica_1p', calibre: 10, circuito: 'Luces', confianza: 'alta' },
    { tipo: 'termica_1p', calibre: 16, circuito: 'Tomas', confianza: 'media' },
    { tipo: 'termica_1p', calibre: 20, circuito: '', confianza: 'baja' },
  ],
  avisos: ['La quinta protección no tiene rótulo: confirmá qué circuito alimenta.'],
};

export const taller = () => ({
  iaTablero(foto: unknown): SugerenciaTablero {
    if (!(foto instanceof Blob) || !TIPOS_FOTO.has(foto.type)) throw fallo('validacion', 415, 'tipo_archivo_prohibido', 'Mandá una foto (JPEG, PNG o WebP).');
    if (foto.size > MAX_FOTO) throw fallo('limite', 413, 'limite', 'La foto pesa más de 5 MB.');
    return structuredClone(TABLERO_SIMULADO);
  },
  iaPresupuesto(entrada: unknown): PresupuestoSugerido {
    const ok = PresupuestoDictadoSchema.safeParse(entrada);
    if (!ok.success) throw zodAFallo(ok.error);
    if (ok.data.rubro !== 'electricidad') {
      return { tareas: [{ descripcion: 'Visita, diagnóstico y presupuesto', horas: 1 }], materiales: [], avisos: ['Por ahora el dictado entiende trabajos de electricidad.'] };
    }
    return presupuestoElectrico(ok.data.texto);
  },
});
