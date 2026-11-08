'use client';
// CU-Notificaciones (lote 1.4): qué avisos te llegan y en qué horario. Los avisos del teléfono son opcionales y su entrega
// no está garantizada: todo lo importante queda siempre en Avisos. Cada interruptor se guarda al instante.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { PreferenciasCuenta } from '../../data/api/cuenta.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { cuerpoPreferencias, SILENCIO_POR_DEFECTO, textoSilencio } from '../../lib/cuenta.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaAjuste, GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';

export function NotificacionesCuenta() {
  const c = useCarga(() => api.preferencias(), []);
  const { pendiente, fallo, ejecutar } = useAccion();
  const [horario, setHorario] = useState(false);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const p = c.datos;

  /** El refresco va dentro de la acción: el interruptor se libera con lo que dice el servidor. */
  async function guardar(cambio: Partial<Omit<PreferenciasCuenta, 'push'>>) {
    const r = await ejecutar(async () => {
      await api.guardarPreferencias(cuerpoPreferencias(p, cambio));
      await c.recargar();
    });
    if (!r.ok) await c.recargar();
    return r.ok;
  }
  async function activarPush() {
    await ejecutar(async () => {
      await api.activarPush();
      await c.recargar();
    });
  }
  // Los campos que son nuevos en 0.11.0 pueden no venir todavía: sin dato, se muestran encendidos (lo normal).
  const si = (v: boolean | undefined) => v !== false;

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Avisos" subtitulo="Qué te llega" hrefVolver={RUTAS.cuenta.ruta} />}>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <GrupoAjustes etiqueta="Pedidos y trabajos">
        <FilaAjuste titulo="Pedidos urgentes" detalle="Solo si estás Disponible en el Inicio" encendido={p.avisosUrgentes} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosUrgentes: v })} />
        <FilaAjuste titulo="Pedidos programados" detalle="Para otro día y visitas de presupuesto" encendido={p.avisosProgramados} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosProgramados: v })} />
        <FilaAjuste titulo="Respuestas de clientes" detalle="Aceptó, pidió cambios o escribió" encendido={p.avisosMensajes} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosMensajes: v })} />
        <FilaAjuste titulo="Recordatorios" detalle="Turnos, jornadas y repuestos que faltan" encendido={si(p.avisosRecordatorios)} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosRecordatorios: v })} />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Plata y camino">
        <FilaAjuste titulo="Pagos verificados" detalle="Cuando se confirma un cobro, o hay un problema" encendido={p.avisosPagos} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosPagos: v })} />
        <FilaAjuste titulo="Tu camino" detalle="Cuando llegás a un premio" encendido={si(p.avisosCamino)} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosCamino: v })} />
        <FilaAjuste titulo="Novedades de Handyx" detalle="Una vez por mes, como mucho" encendido={p.avisosNovedades === true} deshabilitado={pendiente} onCambio={(v) => void guardar({ avisosNovedades: v })} />
      </GrupoAjustes>

      <GrupoAjustes>
        <FilaAjuste
          titulo={p.silencio ? `Silencio de ${textoSilencio(p.silencio)}` : 'Silencio de noche'}
          detalle="Salvo pedidos urgentes si estás Disponible"
          encendido={p.silencio != null}
          deshabilitado={pendiente}
          onCambio={(v) => void guardar({ silencio: v ? SILENCIO_POR_DEFECTO : null })}
        />
        {p.silencio ? (
          <div className="ui-ajuste__extra">
            <Boton variante="contorno" chico bloque={false} icono="reloj" onClick={() => setHorario(true)}>
              Cambiar las horas
            </Boton>
          </div>
        ) : null}
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Avisos del teléfono">
        <div className="ui-ajuste__extra ui-ajuste__extra--pila">
          {p.push === 'activado' ? (
            <Chip tono="exito" icono="check">
              Activados en este teléfono
            </Chip>
          ) : null}
          {p.push === 'no_disponible' ? <p>Este navegador no permite avisos del teléfono. Los vas a ver igual en Avisos.</p> : null}
          {p.push === 'rechazado' ? <p>Rechazaste el permiso en este teléfono. Lo podés cambiar desde los ajustes del navegador. La app sigue funcionando: todos los avisos están en Avisos.</p> : null}
          {p.push === 'sin_pedir' || p.push === 'rechazado' ? (
            <Boton variante="contorno" icono="campana" ocupado={pendiente} textoOcupado="Activando…" onClick={() => void activarPush()}>
              Activar avisos del teléfono
            </Boton>
          ) : null}
          <p className="ui-nota">La entrega no está garantizada (sobre todo en iPhone). Lo importante siempre queda en la app.</p>
        </div>
      </GrupoAjustes>
      <BotonEnlace variante="contorno" icono="campana" href={RUTAS.notificaciones.ruta}>
        Ver mis avisos
      </BotonEnlace>

      <HojaHorario abierta={horario} desde={p.silencio?.desde ?? SILENCIO_POR_DEFECTO.desde} hasta={p.silencio?.hasta ?? SILENCIO_POR_DEFECTO.hasta} ocupado={pendiente} onCerrar={() => setHorario(false)} onGuardar={async (s) => {
        if (await guardar({ silencio: s })) setHorario(false);
      }} />
    </PantallaSecundaria>
  );
}

function HojaHorario({ abierta, ...resto }: { abierta: boolean; desde: string; hasta: string; ocupado: boolean; onCerrar(): void; onGuardar(s: { desde: string; hasta: string }): Promise<void> }) {
  return abierta ? <FormHorario {...resto} /> : <Hoja abierta={false} titulo="Silencio" onCerrar={resto.onCerrar}>{null}</Hoja>;
}

function FormHorario({ desde: d0, hasta: h0, ocupado, onCerrar, onGuardar }: { desde: string; hasta: string; ocupado: boolean; onCerrar(): void; onGuardar(s: { desde: string; hasta: string }): Promise<void> }) {
  const [desde, setDesde] = useState(d0);
  const [hasta, setHasta] = useState(h0);
  return (
    <Hoja abierta titulo="Horas de silencio" onCerrar={onCerrar} pie={<Boton ocupado={ocupado} textoOcupado="Guardando…" onClick={() => void onGuardar({ desde, hasta })}>Guardar las horas</Boton>}>
      <div className="ui-edicion">
        <p>En ese horario no te mandamos avisos al teléfono, salvo pedidos urgentes si estás Disponible. Los ves después en Avisos.</p>
        <Campo etiqueta="Desde" type="time" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Campo etiqueta="Hasta" type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} />
      </div>
    </Hoja>
  );
}
