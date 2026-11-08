import type { Ruta } from './tipos.ts';

// Registro y onboarding (lote 1.2). RG-1 (crear la cuenta) es `/registro/`, en rutas/acceso.ts.
export const rutasAlta = {
  alta: { ruta: '/alta/', titulo: 'Tu alta', lote: '1.2', descripcion: 'Registro en 10 pasos que se retoma (RG-2 a RG-10, ?paso=) y estado del alta: lo listo, lo que evaluamos y lo que falta (D6-Alta).' },
  obHabilitado: { ruta: '/alta/habilitado/', titulo: '¡Estás habilitado!', lote: '1.2', descripcion: 'Aparece sola, una vez, cuando el equipo de verificación te habilita: rubros activados y kit de bienvenida (OB-Aprobado).' },
  obPermisos: { ruta: '/alta/permisos/', titulo: 'Antes de empezar', lote: '1.2', descripcion: 'Para qué sirven los avisos y la ubicación; los activás si querés (OB-Permisos).' },
  obComoFunciona: { ruta: '/alta/como-funciona/', titulo: 'Cómo funciona', lote: '1.2', descripcion: 'Tres láminas: te llega un pedido, ponés tu precio y cobrás directo (OB-Tour).' },
  obPrimerosPasos: { ruta: '/alta/primeros-pasos/', titulo: 'Primeros pasos', lote: '1.2', descripcion: 'Perfil, horarios, cobros, lista de precios, equipamiento y manual; ninguno es obligatorio (OB-PrimerosPasos).' },
} as const satisfies Record<string, Ruta>;
