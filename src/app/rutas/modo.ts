import type { Ruta } from './tipos.ts';

// Modo trabajo y cierre (lote 2.3, fases H0.4 y H0.4b). Sin barra de pestañas: cabecera propia o barra compacta.
export const rutasModo = {
  modoTrabajo: { ruta: '/trabajos/modo/', titulo: 'Modo trabajo', lote: '2.3', descripcion: 'H0-Modo: cronómetro, tareas grandes que empiezan por la seguridad, foto, repuestos, pedir ayuda, agenda, herramientas a mano (H0-ModoHerramientas, en una hoja: ?hoja=herramientas), pausar, «tarea lista» y «terminé».' },
  modoAyuda: { ruta: '/trabajos/modo/ayuda/', titulo: 'Pedir ayuda', lote: '2.3', descripcion: 'H0-ModoAyuda: llamar o escribirle a un contacto profesional, sumarlo al trabajo o buscar un profesional nuevo.' },
  modoAgenda: { ruta: '/trabajos/modo/agenda/', titulo: 'Tu agenda', lote: '2.3', descripcion: 'H0-ModoAgenda: lo que sigue después de este trabajo y avisarle al próximo cliente una demora (lo mandás vos).' },
  antesDespues: { ruta: '/trabajos/antes-despues/', titulo: 'Antes y después', lote: '2.3', descripcion: 'H0-AntesDespues y H0-AntesLado (?vista=lado): las dos fotos para comparar y «qué cambiaste», escrito o dictado.' },
  informeTrabajo: { ruta: '/trabajos/informe/', titulo: 'Informe del trabajo', lote: '2.3', descripcion: 'H0-Informe: secciones que se completan solas (causa, antes y después, pruebas, materiales y garantía, recomendaciones) y mandarlo pidiendo la conformidad.' },
  informeEnviado: { ruta: '/trabajos/informe/enviado/', titulo: 'Trabajo terminado', lote: '2.3', descripcion: 'H0-InformeEnviado: conformidad del cliente, garantía activa, recordatorio de mantenimiento para vos, el cobro y el PDF.' },
} as const satisfies Record<string, Ruta>;
