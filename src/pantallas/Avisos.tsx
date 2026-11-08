'use client';
// D6-Avisos (lote 1.4): todos tus avisos (pedidos, obras, mensajes, pagos) agrupados por día. Cada aviso abre su detalle;
// NINGUNO acepta nada por vos. Cada uno tiene su botón para quitarlo (no hace falta deslizar) y «Borrar todos» pide
// confirmación. Lo importante no se pierde al borrar: sigue en su pantalla (pedido, trabajo, caja).
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import type { TipoAvisoBandeja } from '../contracts/cuenta.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { agruparAvisos, destinoAviso, momentoDeAviso, TITULO_GRUPO } from '../lib/avisos.ts';
import { Boton } from '../ui/atomos/Boton.tsx';
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';
import { Ciudad } from '../ui/ilustraciones/Ciudad.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { EstadoVacio } from '../ui/organismos/EstadosPantalla.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { GrupoAvisos, ItemAviso } from '../ui/organismos/ListaAvisos.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';

const ICONO: Record<TipoAvisoBandeja, NombreIconoUi> = {
  pedido_urgente: 'herramienta',
  pedido_programado: 'calendario',
  propuesta: 'billete',
  te_eligieron: 'check',
  mensaje: 'chat',
  trabajo: 'herramienta',
  pago: 'billete',
  soporte: 'ayuda',
  cuenta: 'cuenta',
  alta_habilitada: 'escudo',
  presupuesto: 'documento',
  obra: 'obra',
  repuesto: 'alerta',
  reparto: 'cuenta',
  equipo: 'cuenta',
  busqueda: 'lupa',
  ferreteria: 'tienda',
  camino: 'estrella',
  recordatorio: 'reloj',
};

export function Avisos() {
  const c = useCarga(() => api.bandeja(), []);
  const ahora = useAhora(30_000);
  const quitar = useAccion();
  const [confirmar, setConfirmar] = useState(false);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const items = c.datos.items;
  const grupos = agruparAvisos(items, ahora);

  async function quitarUno(id: string) {
    await quitar.ejecutar(async () => {
      await api.borrarDeBandeja(id);
      await c.recargar();
    });
  }
  async function quitarTodos() {
    const r = await quitar.ejecutar(async () => {
      await api.vaciarBandeja();
      await c.recargar();
    });
    if (r.ok) setConfirmar(false);
  }

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Avisos" hrefVolver={RUTAS.inicio.ruta} />}>
      {quitar.fallo && !confirmar ? <ErrorCaja fallo={quitar.fallo} /> : null}
      {items.length === 0 ? (
        <EstadoVacio ilustracion={<Ciudad tam="medio" />} titulo="No tenés avisos">
          Cuando haya un pedido para vos, una respuesta o un cobro, te avisamos acá.
        </EstadoVacio>
      ) : (
        <>
          {grupos.map((g) => (
            <GrupoAvisos key={g.grupo} titulo={TITULO_GRUPO[g.grupo]}>
              {g.items.map((a) => (
                <ItemAviso
                  key={a.id}
                  titulo={a.titulo}
                  cuerpo={a.cuerpo}
                  momento={momentoDeAviso(a.creadoEn, ahora)}
                  icono={ICONO[a.tipo]}
                  iniciales={a.iniciales}
                  nuevo={!a.leido}
                  href={destinoAviso(a.destino)}
                  onAbrir={() => {
                    if (!a.leido) void api.marcarLeidoEnBandeja(a.id).catch(() => undefined);
                  }}
                  onQuitar={() => void quitarUno(a.id)}
                />
              ))}
            </GrupoAvisos>
          ))}
          <p className="ui-nota">Los avisos te llevan al detalle. Nada se acepta desde acá.</p>
          <Boton variante="contorno" icono="tacho" onClick={() => setConfirmar(true)}>
            Borrar todos los avisos
          </Boton>
        </>
      )}
      <Hoja
        abierta={confirmar}
        titulo="¿Borrar todos los avisos?"
        onCerrar={() => setConfirmar(false)}
        pie={
          <>
            <Boton variante="peligro" ocupado={quitar.pendiente} textoOcupado="Borrando…" onClick={() => void quitarTodos()}>
              Sí, borrar todos
            </Boton>
            <Boton variante="contorno" onClick={() => setConfirmar(false)}>
              No, volver
            </Boton>
          </>
        }
      >
        <p>Se borran de esta lista. Lo importante no se pierde: los pedidos, trabajos y cobros siguen en sus pantallas.</p>
        {quitar.fallo ? <ErrorCaja fallo={quitar.fallo} onReintentar={() => void quitarTodos()} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}
