// Panel de prueba del mock: escenarios, fallas simuladas, reloj y simulación de las otras partes
// (Operations, usuario del hogar, proveedor de pagos). Solo existe con el origen mock: el bundle de
// producción no lo incluye (scripts/verificar-bundle.mjs).
import { faltantesParaHabilitar } from '../../contracts/maquinas.ts';
import { monto } from '../../contracts/dinero.ts';
import { requiereMatricula } from '../../contracts/rubros.ts';
import type { Propuesta } from '../../contracts/dto.ts';
import { ahoraMs, ESCENARIOS, ETIQUETA_ESCENARIO, idNuevo, iso, RELOJ_BASE, SENALES_PRUEBA, type Escenario, type EstadoMock, type SenalPrueba } from './estado.ts';
import { crearEstado, ID } from './fixtures.ts';
import { agregarMensaje, aplicarAceptacion } from './propuestas.ts';
import { destinoPrueba, zonaPrueba } from './mapa.ts';
import { recalcular } from './reglas.ts';
import { reservar } from './turnos.ts';

export interface AccionPrueba {
  id: string;
  etiqueta: string;
  grupo: string;
}
export interface TogglePrueba {
  id: string;
  etiqueta: string;
  activo: boolean;
}
export interface VistaControles {
  escenario: Escenario;
  escenarios: Array<{ id: Escenario; etiqueta: string }>;
  ahora: string;
  nota: string | null;
  toggles: TogglePrueba[];
  acciones: AccionPrueba[];
  relojes: Array<{ id: string; etiqueta: string }>;
}
export interface ControlesPrueba {
  vista(): VistaControles;
  elegirEscenario(e: Escenario): void;
  ejecutar(id: string): void;
  alternar(id: string): void;
  fijarReloj(id: string): void;
  /** Se llama tras cada acción del panel para que las pantallas vuelvan a pedir sus datos. */
  alCambiar(fn: () => void): () => void;
}

const ETIQUETA_SENAL: Record<SenalPrueba, string> = {
  normal: 'Señal normal',
  imprecisa: 'Señal imprecisa (± 250 m)',
  sin_senal: 'Sin señal',
  sin_permiso: 'Permiso de ubicación negado',
};

const MIN = 60_000;
const HORA = 60 * MIN;
const RELOJES: Record<string, { etiqueta: string; ms: number | null; delta?: number }> = {
  demo: { etiqueta: '17/11 12:00 · dentro de la demo (por defecto)', ms: RELOJ_BASE },
  antes: { etiqueta: '29/10 · antes de la demo', ms: Date.parse('2026-10-29T15:00:00Z') },
  ultimo: { etiqueta: '10/12 22:00 · último día de fee 0 %', ms: Date.parse('2026-12-11T01:00:00Z') },
  despues: { etiqueta: '11/12 12:00 · la demo terminó', ms: Date.parse('2026-12-11T15:00:00Z') },
  mas5: { etiqueta: '+5 minutos', ms: null, delta: 5 * MIN },
  mas20: { etiqueta: '+20 minutos', ms: null, delta: 20 * MIN },
  mas12h: { etiqueta: '+12 horas', ms: null, delta: 12 * HORA },
};

const ultima = (s: EstadoMock, f: (p: Propuesta) => boolean): Propuesta | undefined => s.propuestas.filter(f).at(-1);
const vigente = (s: EstadoMock) => (p: Propuesta) => p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs(s);

export function crearControles(s: EstadoMock, alReiniciar: () => void): ControlesPrueba {
  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((f) => f());

  const acciones = (): AccionPrueba[] => {
    const a: AccionPrueba[] = [];
    const e = s.perfil.estadoAlta;
    const op = (id: string, etiqueta: string) => a.push({ id, etiqueta, grupo: 'Operations (alta)' });
    if (e === 'enviada') op('ops_revision', 'Tomar el alta en revisión');
    if (e === 'en_revision') {
      op('ops_verificar', 'Verificar documentos y matrículas');
      if (s.perfil.antecedentes === 'pendiente_cita' || s.perfil.antecedentes === 'no_asistio') op('ops_cita', 'Coordinar cita presencial de antecedentes');
      if (s.perfil.antecedentes === 'cita_coordinada') op('ops_aprobar', 'Aprobar antecedentes (presencial)');
      op('ops_correccion', 'Pedir una corrección');
      op('ops_rechazar', 'Rechazar el alta');
      op('ops_habilitar', 'Habilitar');
    }
    const u = (id: string, etiqueta: string) => a.push({ id, etiqueta, grupo: 'Usuario del hogar' });
    if (s.perfil.estadoAlta === 'habilitada') {
      u('usuario_acepta', 'Acepta tu última propuesta');
      u('usuario_rechaza', 'Rechaza tu última propuesta');
      u('usuario_contraoferta', 'Te contraoferta (−10 %)');
      u('usuario_cambio', 'Pide mover la fecha de un trabajo');
      u('usuario_acepta_adicional', 'Acepta tu último adicional');
      u('usuario_rechaza_adicional', 'Rechaza tu último adicional');
      u('usuario_mensaje', 'Te escribe un mensaje');
      u('pedido_urgente', 'Entra un pedido urgente nuevo');
      const p = (id: string, etiqueta: string) => a.push({ id, etiqueta, grupo: 'Pagos y soporte' });
      p('pago_mp_ok', 'Mercado Pago confirma un pago (webhook)');
      p('pago_mp_falla', 'Mercado Pago informa un pago fallido');
      p('pago_ops_verifica', 'Operations verifica un cobro reportado');
      p('soporte_responde', 'Handyx responde un caso de soporte');
    }
    if (s.baja?.estado === 'solicitada' || s.baja?.estado === 'en_proceso') a.push({ id: 'baja_procesar', etiqueta: 'Avanzar el proceso de baja', grupo: 'Cuenta' });
    a.push({ id: 'sesion_expira', etiqueta: 'Expirar la sesión ahora', grupo: 'Cuenta' });
    if (s.perfil.estadoAlta === 'habilitada') {
      const g = (id: string, etiqueta: string) => a.push({ id, etiqueta, grupo: 'Ubicación (GPS simulado)' });
      for (const senal of SENALES_PRUEBA) g(`gps_${senal}`, `${ETIQUETA_SENAL[senal]}${s.gps.senal === senal ? ' · actual' : ''}`);
      g('gps_desviar', 'Desviarme del trayecto');
    }
    return a;
  };

  function ejecutar(id: string): void {
    s.nota = null;
    const habilitarOperacion = () => {
      const completo = crearEstado('habilitado');
      s.pedidos = completo.pedidos;
      s.propuestas = completo.propuestas.filter((p) => p.id === ID.pr1);
      s.conversaciones = completo.conversaciones.filter((c) => c.id === ID.c2);
      s.mensajes = { [ID.c2]: completo.mensajes[ID.c2] ?? [] };
      s.avisos = [...completo.avisos.filter((x) => ['pedido_urgente', 'pedido_programado', 'propuesta'].includes(x.tipo)), ...s.avisos];
    };
    switch (id) {
      case 'ops_revision':
        s.perfil.estadoAlta = 'en_revision';
        for (const k of ['dni', 'cuitCuil', 'fotoCara'] as const) if (s.perfil.documentos[k] === 'cargado') s.perfil.documentos[k] = 'en_revision';
        for (const r of s.perfil.rubros) if (r.matricula === 'cargado') r.matricula = 'en_revision';
        s.nota = 'Operations tomó tu alta en revisión.';
        break;
      case 'ops_verificar':
        for (const k of ['dni', 'cuitCuil', 'fotoCara'] as const) if (s.perfil.documentos[k] === 'en_revision') s.perfil.documentos[k] = 'verificado';
        for (const r of s.perfil.rubros) if (r.matricula === 'en_revision') r.matricula = 'verificado';
        s.nota = 'Operations verificó los documentos. Falta la verificación presencial de antecedentes.';
        break;
      case 'ops_cita':
        {
          const libre = s.turnos.find((t) => t.disponible && Date.parse(t.inicio) > ahoraMs(s));
          if (libre) reservar(s, libre.id);
          else s.perfil.antecedentes = 'cita_coordinada';
        }
        s.nota = 'Operations coordinó una cita presencial.';
        break;
      case 'ops_aprobar':
        s.perfil.antecedentes = 'aprobada';
        s.nota = 'Operations registró el resultado de la verificación presencial (sin archivos).';
        break;
      case 'ops_correccion':
        s.perfil.estadoAlta = 'requiere_correccion';
        s.perfil.motivoRevision = 'La foto de tu cara no se ve bien. Volvé a cargarla con buena luz.';
        s.perfil.documentos.fotoCara = 'rechazado';
        s.nota = 'Operations pidió una corrección.';
        break;
      case 'ops_rechazar':
        s.perfil.estadoAlta = 'rechazada';
        s.perfil.motivoRevision = 'No pudimos validar tu alta con la documentación presentada. Si creés que es un error, escribinos desde Ayuda.';
        s.nota = 'Operations rechazó el alta.';
        break;
      case 'ops_habilitar': {
        const faltan = faltantesParaHabilitar({
          dni: s.perfil.documentos.dni,
          cuitCuil: s.perfil.documentos.cuitCuil,
          fotoCara: s.perfil.documentos.fotoCara,
          antecedentes: s.perfil.antecedentes,
          rubrosHabilitados: s.perfil.rubros.filter((r) => !requiereMatricula(r.rubro) || r.matricula === 'verificado').length,
        });
        if (faltan.length > 0) {
          s.nota = `No se puede habilitar: falta ${faltan.join(', ')}. Cargado no es verificado.`;
          break;
        }
        s.perfil.estadoAlta = 'habilitada';
        s.perfil.motivoRevision = null;
        s.perfil.rubros = s.perfil.rubros.map((r) => (!requiereMatricula(r.rubro) || r.matricula === 'verificado' ? { ...r, estado: 'habilitado' as const } : { ...r, estado: 'requiere_matricula' as const }));
        habilitarOperacion();
        s.nota = 'Alta habilitada. Declará tu disponibilidad y cobertura para empezar a ver pedidos.';
        break;
      }
      case 'usuario_acepta': {
        const p = ultima(s, (x) => x.autorRol === 'especialista' && vigente(s)(x));
        if (!p) { s.nota = 'No hay una propuesta tuya vigente.'; break; }
        p.estado = 'aceptada';
        p.version += 1;
        aplicarAceptacion(s, p);
        {
          const t = s.trabajos.find((x) => x.trabajo.propuestaAceptadaId === p.id);
          s.avisos.unshift({ id: idNuevo(s), tipo: 'te_eligieron', titulo: '¡El cliente te eligió!', cuerpo: 'Aceptó tu propuesta. Abrí el trabajo para ver la dirección y el horario.', creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'trabajo', id: t?.trabajo.id ?? null } });
        }
        s.nota = 'El usuario aceptó tu propuesta: se creó el trabajo.';
        break;
      }
      case 'usuario_rechaza': {
        const p = ultima(s, (x) => x.autorRol === 'especialista' && vigente(s)(x));
        if (!p) { s.nota = 'No hay una propuesta tuya vigente.'; break; }
        p.estado = 'rechazada';
        p.version += 1;
        s.nota = 'El usuario rechazó tu propuesta.';
        break;
      }
      case 'usuario_contraoferta': {
        const p = ultima(s, (x) => x.autorRol === 'especialista' && vigente(s)(x));
        if (!p) { s.nota = 'No hay una propuesta tuya vigente.'; break; }
        p.estado = 'reemplazada';
        p.version += 1;
        const pedido = s.pedidos.find((x) => x.pub.id === p.pedidoId);
        const nueva: Propuesta = { ...p, id: idNuevo(s), autorRol: 'usuario', monto: monto(Math.round((p.monto.centavos * 0.9) / 100) * 100), estado: 'pendiente', reemplazaA: p.id, version: 0, venceEn: iso(ahoraMs(s) + (pedido?.pub.tipo === 'urgente' ? 5 * MIN : 24 * HORA)) };
        s.propuestas.push(nueva);
        if (pedido?.conversacionId) agregarMensaje(s, pedido.conversacionId, { autorRol: 'usuario', tipo: 'propuesta', texto: null, propuestaId: nueva.id });
        s.nota = 'El usuario te contraofertó con un 10 % menos.';
        break;
      }
      case 'usuario_cambio': {
        const t = s.trabajos.find((x) => x.trabajo.estado === 'agendado' && !x.cambioPendienteId);
        if (!t) { s.nota = 'No hay un trabajo agendado sin cambios pendientes.'; break; }
        const inicio = Date.parse(t.trabajo.acuerdo.horario.inicio) + 24 * HORA;
        const p: Propuesta = { id: idNuevo(s), pedidoId: t.trabajo.pedidoId, autorRol: 'usuario', monto: t.trabajo.acuerdo.monto, alcance: t.trabajo.acuerdo.alcance, horario: { inicio: iso(inicio), fin: iso(inicio + 2 * HORA) }, venceEn: iso(ahoraMs(s) + 24 * HORA), estado: 'pendiente', reemplazaA: t.trabajo.propuestaAceptadaId, version: 0 };
        s.propuestas.push(p);
        t.cambioPendienteId = p.id;
        s.nota = 'El usuario pidió mover la fecha un día. El acuerdo no cambia hasta que respondas.';
        break;
      }
      case 'usuario_acepta_adicional':
      case 'usuario_rechaza_adicional': {
        const acepta = id === 'usuario_acepta_adicional';
        const t = s.trabajos.find((x) => x.adicionales.some((a) => a.estado === 'pendiente'));
        const ad = t ? [...t.adicionales].reverse().find((a) => a.estado === 'pendiente') : undefined;
        if (!t || !ad) { s.nota = 'No hay un adicional esperando respuesta.'; break; }
        ad.estado = acepta ? 'aceptado' : 'rechazado';
        ad.respondidoEn = iso(ahoraMs(s));
        ad.version += 1;
        s.avisos.unshift({ id: idNuevo(s), tipo: 'trabajo', titulo: acepta ? 'Aceptó el adicional' : 'No aceptó el adicional', cuerpo: `${ad.descripcion}. ${acepta ? 'Ya se suma al total del trabajo.' : 'Sigue el precio vigente.'}`, creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'trabajo', id: t.trabajo.id } });
        s.nota = acepta ? 'El usuario aceptó el adicional: se suma al total.' : 'El usuario rechazó el adicional: sigue el precio vigente.';
        break;
      }
      case 'usuario_mensaje': {
        const c = s.conversaciones.find((x) => x.etapa !== 'cerrada');
        if (!c) { s.nota = 'No hay conversaciones abiertas.'; break; }
        agregarMensaje(s, c.id, { autorRol: 'usuario', tipo: 'texto', texto: 'Hola, ¿seguís disponible?' });
        s.nota = 'Llegó un mensaje nuevo.';
        break;
      }
      case 'pedido_urgente': {
        const base = s.pedidos.find((p) => p.pub.id === ID.pUrgente);
        const idp = idNuevo(s);
        const destino = destinoPrueba(idp, 'Centro');
        s.pedidos.push({ pub: { id: idp, rubro: 'plomeria', tipo: 'urgente', descripcion: 'Se rompió un caño debajo de la pileta y pierde agua (pedido de prueba).', zonaAproximada: 'Centro', zonaMapa: zonaPrueba(idp, destino), fechaSolicitada: null, creadoEn: iso(ahoraMs(s)), ventanaHasta: iso(ahoraMs(s) + 20 * MIN), estado: 'buscando' }, cliente: 'Cliente de prueba 10', direccion: base?.direccion ?? 'Dirección de prueba 100 (ficticia)', destino, metodoPago: 'mercado_pago', conversacionId: null });
        s.avisos.unshift({ id: idNuevo(s), tipo: 'pedido_urgente', titulo: 'Pedido urgente en tu zona', cuerpo: 'Plomería · Centro. Abrilo para ver el detalle y decidir.', creadoEn: iso(ahoraMs(s)), leido: false, destino: { ruta: 'pedido', id: idp } });
        s.nota = s.disponibilidad.urgentesAhora ? 'Entró un pedido urgente.' : 'Entró un pedido urgente, pero no lo ves: tenés urgentes apagados (el servidor no te lo ofrece).';
        break;
      }
      case 'pago_mp_ok': {
        const p = s.pagos.find((x) => x.metodo === 'mercado_pago' && x.estado === 'pendiente');
        if (!p) { s.nota = 'No hay un pago de Mercado Pago pendiente.'; break; }
        p.estado = 'verificado'; p.fuenteConfirmacion = 'webhook_proveedor'; p.referenciaProveedor = 'MP-PRUEBA-0100'; p.actualizadoEn = iso(ahoraMs(s));
        s.nota = 'Mercado Pago confirmó el pago (webhook validado).';
        break;
      }
      case 'pago_mp_falla': {
        const p = s.pagos.find((x) => x.metodo === 'mercado_pago' && x.estado === 'pendiente');
        if (!p) { s.nota = 'No hay un pago de Mercado Pago pendiente.'; break; }
        p.estado = 'fallido'; p.fuenteConfirmacion = 'webhook_proveedor'; p.actualizadoEn = iso(ahoraMs(s));
        s.nota = 'Mercado Pago informó que el pago falló.';
        break;
      }
      case 'pago_ops_verifica': {
        const p = s.pagos.find((x) => x.estado === 'reportado' || x.estado === 'en_discrepancia');
        if (!p) { s.nota = 'No hay cobros reportados.'; break; }
        p.estado = 'verificado'; p.fuenteConfirmacion = 'operations'; p.actualizadoEn = iso(ahoraMs(s));
        s.nota = 'Operations verificó el cobro.';
        break;
      }
      case 'soporte_responde': {
        const c = s.casos.find((x) => x.estado !== 'cerrado' && x.estado !== 'resuelto') ?? s.casos[0];
        if (!c) { s.nota = 'No hay casos.'; break; }
        c.eventos.push({ id: idNuevo(s), autor: 'handy', texto: 'Revisamos tu caso. ¿Podés confirmarnos si el problema sigue?', adjuntos: 0, creadoEn: iso(ahoraMs(s)) });
        c.estado = 'esperando_respuesta';
        c.actualizadoEn = iso(ahoraMs(s));
        s.nota = 'Handyx respondió un caso.';
        break;
      }
      case 'baja_procesar':
        if (s.baja?.estado === 'solicitada') s.baja = { ...s.baja, estado: 'en_proceso', mensaje: 'Estamos procesando tu baja: borramos tu perfil y tus documentos. Ya no podés cancelarla.' };
        else if (s.baja) s.baja = { ...s.baja, estado: 'completada_con_retencion', mensaje: 'Tu cuenta fue dada de baja. Conservamos solo los registros que la ley nos obliga a guardar (por ejemplo, de trabajos y pagos ya realizados), con acceso restringido.' };
        s.perfil.baja = s.baja?.estado ?? null;
        break;
      case 'gps_normal':
      case 'gps_imprecisa':
      case 'gps_sin_senal':
      case 'gps_sin_permiso':
        s.gps.senal = id.slice(4) as SenalPrueba;
        s.nota = `GPS simulado: ${ETIQUETA_SENAL[s.gps.senal].toLowerCase()}.`;
        break;
      case 'gps_desviar':
        s.gps.desviar = true;
        s.nota = 'El GPS simulado se va 150 m de costado. Con dos posiciones fuera, el servidor recalcula el trayecto.';
        break;
      case 'sesion_expira':
        s.sesionExpirada = true;
        s.nota = 'La sesión expiró: la próxima acción te pide volver a entrar.';
        break;
    }
    recalcular(s);
    avisar();
  }

  return {
    vista: () => ({
      escenario: s.escenario,
      escenarios: ESCENARIOS.map((id) => ({ id, etiqueta: ETIQUETA_ESCENARIO[id] })),
      ahora: new Date(ahoraMs(s)).toISOString(),
      nota: s.nota,
      toggles: [
        { id: 'falla', etiqueta: 'Sin conexión (red caída)', activo: s.falla === 'red' },
        { id: 'servidor', etiqueta: 'El servidor responde con error', activo: s.falla === 'servidor' },
        { id: 'mensaje', etiqueta: 'Falla el próximo mensaje', activo: s.fallaMensaje },
        { id: 'conflicto', etiqueta: 'Doble aceptación: otra persona gana la próxima respuesta', activo: s.conflictoProximo },
        { id: 'push', etiqueta: 'Rechazar el permiso de avisos del dispositivo', activo: s.pushRechazado },
        { id: 'gps_rapido', etiqueta: 'GPS simulado rápido (×6)', activo: s.gps.rapido },
      ],
      acciones: acciones(),
      relojes: Object.entries(RELOJES).map(([id, r]) => ({ id, etiqueta: r.etiqueta })),
    }),
    elegirEscenario(e) {
      Object.assign(s, crearEstado(e));
      alReiniciar();
      avisar();
    },
    ejecutar,
    alternar(id) {
      if (id === 'falla') s.falla = s.falla === 'red' ? null : 'red';
      if (id === 'servidor') s.falla = s.falla === 'servidor' ? null : 'servidor';
      if (id === 'mensaje') s.fallaMensaje = !s.fallaMensaje;
      if (id === 'conflicto') s.conflictoProximo = !s.conflictoProximo;
      if (id === 'push') s.pushRechazado = !s.pushRechazado;
      if (id === 'gps_rapido') s.gps.rapido = !s.gps.rapido;
      avisar();
    },
    fijarReloj(id) {
      const r = RELOJES[id];
      if (!r) return;
      const actual = ahoraMs(s);
      s.saltosMs += r.ms !== null ? r.ms - actual : (r.delta ?? 0);
      avisar();
    },
    alCambiar(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}
