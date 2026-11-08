'use client';
// Mano de obra (H0-ManoObra, lote 2.2): tus tarifas por hora, la visita, el recargo de urgencia y lo que cobrás por cada
// tarea, para presupuestar más rápido. Son tus precios: Handyx solo sugiere en cada pedido y vos decidís.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { ManoDeObra, TarifaTarea } from '../../contracts/presupuestos.ts';
import { RUBROS, NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { centavosDesdeTexto } from '../../lib/formato.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Seleccion } from '../../ui/atomos/Seleccion.tsx';
import { Cifra } from '../../ui/atomos/Texto.tsx';
import { CabeceraSeccion, MosaicoCifra } from '../../ui/moleculas/Materiales.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { HojaMonto } from './DetallePrecio.tsx';
import './presupuestos.css';

type Base = 'hora' | 'visita' | 'urgencia';
type Edicion = { tipo: 'base'; campo: Base } | { tipo: 'tarea'; tarea: TarifaTarea | null } | null;

const TITULO_BASE: Record<Base, string> = { hora: 'Tu hora', visita: 'La visita', urgencia: 'Recargo por urgencia' };

export function ManoObra() {
  const c = useCarga(() => api.manoDeObra(), []);
  const [edicion, setEdicion] = useState<Edicion>(null);
  const base = useAccion();

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const m = c.datos;
  const rubros = RUBROS.filter((r) => m.tareas.some((t) => t.rubro === r));

  async function guardarBase(cambio: Partial<Pick<ManoDeObra, 'hora' | 'visita' | 'urgenciaBps'>>) {
    const r = await base.ejecutar(async () => {
      await api.guardarTarifasBase({ hora: m.hora, visita: m.visita, urgenciaBps: m.urgenciaBps, ...cambio, version: m.version });
      await c.recargar();
    });
    if (r.ok) setEdicion(null);
    else if (r.fallo.tipo === 'conflicto') await c.recargar();
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Mano de obra" subtitulo="Tus tarifas" hrefVolver={RUTAS.precios.ruta} />}
      accion={
        <AccionFija>
          <Boton icono="mas" onClick={() => setEdicion({ tipo: 'tarea', tarea: null })}>
            Agregar una tarea
          </Boton>
        </AccionFija>
      }
    >
      <div className="pr-tres">
        <MosaicoCifra rotulo="Hora" tono="azul" centavos={m.hora?.centavos} texto={m.hora ? undefined : 'Sin cargar'} onClick={() => setEdicion({ tipo: 'base', campo: 'hora' })} etiqueta="Cambiar tu hora" />
        <MosaicoCifra rotulo="Visita" centavos={m.visita?.centavos} texto={m.visita ? undefined : 'Sin cargar'} onClick={() => setEdicion({ tipo: 'base', campo: 'visita' })} etiqueta="Cambiar la visita" />
        <MosaicoCifra rotulo="Urgencia" texto={m.urgenciaBps !== null ? `+ ${Math.round(m.urgenciaBps / 100)} %` : 'Sin recargo'} onClick={() => setEdicion({ tipo: 'base', campo: 'urgencia' })} etiqueta="Cambiar el recargo por urgencia" />
      </div>
      {base.fallo ? <ErrorCaja fallo={base.fallo} /> : null}
      {rubros.length === 0 ? <p className="pr-nota">Todavía no cargaste tarifas por tarea.</p> : null}
      {rubros.map((r) => (
        <Tarjeta key={r}>
          <CabeceraSeccion titulo={`Por tarea · ${NOMBRE_RUBRO[r]}`} />
          {m.tareas
            .filter((t) => t.rubro === r)
            .map((t) => (
              <FilaIcono key={t.id} icono="herramienta" titulo={t.nombre} detalle={t.detalle ?? undefined} derecha={<Cifra centavos={t.monto.centavos} tam="chico" como="strong" />} onClick={() => setEdicion({ tipo: 'tarea', tarea: t })} />
            ))}
        </Tarjeta>
      ))}
      <p className="pr-nota">Son tus precios: Handyx solo sugiere para cada pedido y vos decidís.</p>

      {edicion?.tipo === 'base' && edicion.campo !== 'urgencia' ? (
        <HojaMonto
          titulo={TITULO_BASE[edicion.campo]}
          ayuda={edicion.campo === 'hora' ? 'Lo que cobrás por cada hora de trabajo.' : 'Lo que cobrás por ir a ver el trabajo.'}
          centavos={edicion.campo === 'hora' ? (m.hora?.centavos ?? null) : (m.visita?.centavos ?? null)}
          textoBoton="Guardar"
          onCerrar={() => setEdicion(null)}
          onListo={(v) => void guardarBase({ [edicion.campo]: { centavos: v, moneda: 'ARS' } })}
        />
      ) : null}
      {edicion?.tipo === 'base' && edicion.campo === 'urgencia' ? <HojaUrgencia bps={m.urgenciaBps} onCerrar={() => setEdicion(null)} onListo={(v) => void guardarBase({ urgenciaBps: v })} /> : null}
      {edicion?.tipo === 'tarea' ? <HojaTarea key={edicion.tarea?.id ?? 'nueva'} tarea={edicion.tarea} rubroInicial={rubros[0] ?? 'plomeria'} onCerrar={() => setEdicion(null)} alGuardar={c.recargar} /> : null}
    </PantallaSecundaria>
  );
}

function HojaUrgencia({ bps, onCerrar, onListo }: { bps: number | null; onCerrar(): void; onListo(v: number | null): void }) {
  const [texto, setTexto] = useState(bps !== null ? String(Math.round(bps / 100)) : '');
  const [error, setError] = useState<string | null>(null);
  function listo() {
    if (texto.trim() === '' || texto.trim() === '0') return onListo(null);
    const n = Number(texto.trim().replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setError('Escribí un porcentaje de 0 a 100.');
      return document.getElementById('urgencia-pct')?.focus();
    }
    onListo(Math.round(n * 100));
  }
  return (
    <Hoja
      abierta
      titulo="Recargo por urgencia"
      onCerrar={onCerrar}
      pie={
        <Boton icono="check" onClick={listo}>
          Guardar
        </Boton>
      }
    >
      <div className="ui-edicion">
        <Campo id="urgencia-pct" etiqueta="Porcentaje que sumás" inputMode="numeric" autoComplete="off" value={texto} ayuda="Se suma cuando el pedido es urgente. En blanco o 0: sin recargo." error={error} onChange={(e) => setTexto(e.target.value)} />
      </div>
    </Hoja>
  );
}

function HojaTarea({ tarea, rubroInicial, onCerrar, alGuardar }: { tarea: TarifaTarea | null; rubroInicial: Rubro; onCerrar(): void; alGuardar(): Promise<void> }) {
  const a = useAccion();
  const quitar = useAccion();
  const [rubro, setRubro] = useState<Rubro>(tarea?.rubro ?? rubroInicial);
  const [nombre, setNombre] = useState(tarea?.nombre ?? '');
  const [detalle, setDetalle] = useState(tarea?.detalle ?? '');
  const [precio, setPrecio] = useState(tarea ? String(tarea.monto.centavos / 100) : '');
  const [errores, setErrores] = useState<{ nombre?: string; precio?: string }>({});

  async function guardar() {
    const c = centavosDesdeTexto(precio);
    const err: typeof errores = {};
    if (!nombre.trim()) err.nombre = 'Escribí la tarea.';
    if (!c) err.precio = 'Escribí cuánto cobrás, en pesos.';
    setErrores(err);
    if (err.nombre) return document.getElementById('tarea-nombre')?.focus();
    if (err.precio) return document.getElementById('tarea-precio')?.focus();
    const datos = { rubro, nombre: nombre.trim(), detalle: detalle.trim() || null, monto: { centavos: c ?? 0, moneda: 'ARS' as const } };
    const r = await a.ejecutar(async () => {
      if (tarea) await api.cambiarTarifaTarea(tarea.id, { ...datos, version: tarea.version });
      else await api.crearTarifaTarea(datos);
      await alGuardar();
    });
    if (r.ok) onCerrar();
    else if (r.fallo.tipo === 'conflicto') await alGuardar();
  }
  async function borrar() {
    if (!tarea) return;
    const r = await quitar.ejecutar(async () => {
      await api.quitarTarifaTarea(tarea.id);
      await alGuardar();
    });
    if (r.ok) onCerrar();
  }

  return (
    <Hoja
      abierta
      titulo={tarea ? 'Cambiar la tarea' : 'Agregar una tarea'}
      onCerrar={onCerrar}
      pie={
        <div className="pr-pie">
          <Boton icono="check" ocupado={a.pendiente} textoOcupado="Guardando…" onClick={() => void guardar()}>
            Guardar la tarea
          </Boton>
          {tarea ? (
            <Boton variante="texto" icono="tacho" ocupado={quitar.pendiente} textoOcupado="Quitando…" onClick={() => void borrar()}>
              Quitar la tarea
            </Boton>
          ) : null}
        </div>
      }
    >
      <div className="ui-edicion">
        <Seleccion etiqueta="Oficio" value={rubro} onChange={(e) => setRubro(e.target.value as Rubro)}>
          {RUBROS.map((r) => (
            <option key={r} value={r}>
              {NOMBRE_RUBRO[r]}
            </option>
          ))}
        </Seleccion>
        <Campo id="tarea-nombre" etiqueta="Tarea" value={nombre} maxLength={80} autoComplete="off" error={errores.nombre} onChange={(e) => setNombre(e.target.value)} />
        <Campo etiqueta="Qué incluye (opcional)" value={detalle} maxLength={80} autoComplete="off" ayuda="Por ejemplo: «Incluye prueba» o «Por unidad»." onChange={(e) => setDetalle(e.target.value)} />
        <Campo id="tarea-precio" etiqueta="Cuánto cobrás" prefijo="$" inputMode="decimal" autoComplete="off" value={precio} error={errores.precio} onChange={(e) => setPrecio(e.target.value)} />
        {a.fallo ? <ErrorCaja fallo={a.fallo} /> : null}
        {quitar.fallo ? <ErrorCaja fallo={quitar.fallo} /> : null}
      </div>
    </Hoja>
  );
}
