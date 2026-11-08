'use client';
// Detalle de un precio (H0-PrecioItem, lote 2.2): lo que te cuesta y lo que le cobrás al cliente (el margen lo decidís
// vos), cómo varió en el tiempo, si en los presupuestos nuevos va fijo o se actualiza, y el aviso cuando queda viejo.
// Quitarlo de tu lista pide confirmación; los presupuestos ya armados no cambian.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { DIAS_PRECIO_VIEJO, type ModoPrecio, type PrecioDetalle } from '../../contracts/presupuestos.ts';
import { FalloApi } from '../../data/errores.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { centavosDesdeTexto, pesosDesdeCentavos } from '../../lib/formato.ts';
import { diaMes, margenBps, MODO_PRECIO, mesCorto, NOMBRE_CATEGORIA, numero, porcentaje, variacionHistorial } from '../../presupuestos/vista.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaAjuste } from '../../ui/moleculas/Ajustes.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { CabeceraSeccion, MosaicoCifra } from '../../ui/moleculas/Materiales.tsx';
import { OpcionesIcono } from '../../ui/moleculas/OpcionesIcono.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { BarrasHistorial } from '../../ui/organismos/Historial.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './presupuestos.css';

export function DetallePrecio() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.precio(id) : Promise.reject(new FalloApi('no_encontrado', 404))), [id]);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Detalle key={c.datos.id} p={c.datos} recargar={c.recargar} />;
}

type Editando = 'costo' | 'cliente' | 'quitar' | null;

function Detalle({ p, recargar }: { p: PrecioDetalle; recargar(): Promise<void> }) {
  const router = useRouter();
  const [modo, setModo] = useState<ModoPrecio>(p.modoPrecio);
  const [avisar, setAvisar] = useState(p.avisarSiViejoDias !== null);
  const [costo, setCosto] = useState(p.costo.centavos);
  const [cliente, setCliente] = useState(p.precioCliente.centavos);
  const [editando, setEditando] = useState<Editando>(null);
  const [listo, setListo] = useState(false);
  const guardar = useAccion();
  const quitar = useAccion();
  const variacion = variacionHistorial(p.historial);
  const margen = margenBps({ centavos: costo, moneda: 'ARS' }, { centavos: cliente, moneda: 'ARS' });
  const cambio = modo !== p.modoPrecio || avisar !== (p.avisarSiViejoDias !== null) || costo !== p.costo.centavos || cliente !== p.precioCliente.centavos;

  async function enviar() {
    setListo(false);
    const r = await guardar.ejecutar(async () => {
      await api.cambiarPrecio(p.id, {
        ...(costo !== p.costo.centavos ? { costo: { centavos: costo, moneda: 'ARS' as const } } : {}),
        ...(cliente !== p.precioCliente.centavos ? { precioCliente: { centavos: cliente, moneda: 'ARS' as const } } : {}),
        modoPrecio: modo,
        avisarSiViejoDias: avisar ? (p.avisarSiViejoDias ?? DIAS_PRECIO_VIEJO) : null,
        version: p.version,
      });
      await recargar();
    });
    if (r.ok) setListo(true);
    else if (r.fallo.tipo === 'conflicto') await recargar();
  }

  async function borrar() {
    const r = await quitar.ejecutar(() => api.quitarPrecio(p.id));
    if (r.ok) router.push(RUTAS.precios.ruta);
  }

  const puntos = p.historial.slice(-6).map((h) => ({
    rotulo: mesCorto(h.fecha),
    valor: h.costo.centavos,
    texto: numero(Math.round(h.costo.centavos / 10_000) / 10),
    textoLector: `${diaMes(h.fecha)}: ${pesosDesdeCentavos(h.costo.centavos)}`,
  }));

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={p.nombre} subtitulo={`${NOMBRE_CATEGORIA[p.categoria]} · tu lista`} hrefVolver={RUTAS.precios.ruta} />}
      accion={
        <AccionFija>
          <Boton ocupado={guardar.pendiente} textoOcupado="Guardando…" disabled={!cambio} onClick={() => void enviar()}>
            Guardar
          </Boton>
        </AccionFija>
      }
    >
      {listo ? <AvisoCaja tono="exito">Guardamos el precio. Los presupuestos que se actualizan con tu lista te avisan si cambió.</AvisoCaja> : null}
      {p.viejo ? (
        <AvisoCaja tono="info" icono="alerta" titulo="Este precio tiene más de un mes">
          Pedile una lista nueva al corralón o sacale una foto para actualizarlo.
        </AvisoCaja>
      ) : null}
      <div className="pr-dos">
        <MosaicoCifra rotulo="Te cuesta" centavos={costo} detalle={`${p.proveedor ?? 'Cargado a mano'} · ${diaMes(p.actualizadoEn)}`} onClick={() => setEditando('costo')} etiqueta="cambiar" />
        <MosaicoCifra rotulo="Al cliente" tono="azul" centavos={cliente} detalle={`Margen ${porcentaje(margen)}${margen < 0 ? ' menos' : ''} · lo decidís vos`} onClick={() => setEditando('cliente')} etiqueta="cambiar" />
      </div>
      {puntos.length > 1 ? (
        <Tarjeta>
          <CabeceraSeccion
            titulo="Cómo varió · miles de pesos"
            accion={
              variacion ? (
                <Chip tono="amarillo" icono="flechas">
                  {variacion.texto}
                </Chip>
              ) : undefined
            }
          />
          <BarrasHistorial puntos={puntos} etiqueta={`Lo que te costó, del más viejo al más nuevo`} />
        </Tarjeta>
      ) : null}
      <OpcionesIcono<ModoPrecio>
        etiqueta="En presupuestos nuevos"
        etiquetaVisible
        valor={modo}
        onCambio={setModo}
        opciones={(['fijo', 'actualiza'] as const).map((m) => ({ valor: m, icono: MODO_PRECIO[m].icono, titulo: MODO_PRECIO[m].texto, detalle: MODO_PRECIO[m].detalle }))}
      />
      <FilaAjuste titulo={`Avisarme si tiene más de ${p.avisarSiViejoDias ?? DIAS_PRECIO_VIEJO} días`} detalle="Para pedir una lista nueva al corralón" encendido={avisar} onCambio={setAvisar} />
      <Boton variante="texto" icono="tacho" onClick={() => setEditando('quitar')}>
        Quitar de tu lista
      </Boton>
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}

      {editando === 'costo' || editando === 'cliente' ? (
        <HojaMonto
          titulo={editando === 'costo' ? 'Lo que te cuesta' : 'Lo que le cobrás al cliente'}
          ayuda={editando === 'costo' ? 'El precio que pagás en el corralón o la ferretería.' : 'Si ponés más que el costo, ese es tu margen. Lo decidís vos.'}
          centavos={editando === 'costo' ? costo : cliente}
          onCerrar={() => setEditando(null)}
          onListo={(v) => {
            if (editando === 'costo') {
              // Si cobrabas lo mismo que te costaba, sigue igual (sin margen).
              if (cliente === costo) setCliente(v);
              setCosto(v);
            } else setCliente(v);
            setEditando(null);
          }}
        />
      ) : null}
      {editando === 'quitar' ? (
        <Hoja
          abierta
          titulo="¿Quitar este precio?"
          onCerrar={() => setEditando(null)}
          pie={
            <Boton variante="peligro" ocupado={quitar.pendiente} textoOcupado="Quitando…" onClick={() => void borrar()}>
              Quitar {p.nombre}
            </Boton>
          }
        >
          <div className="ui-edicion">
            <p>Deja de estar en tu lista. Los presupuestos que ya armaste no cambian.</p>
            {quitar.fallo ? <ErrorCaja fallo={quitar.fallo} /> : null}
          </div>
        </Hoja>
      ) : null}
    </PantallaSecundaria>
  );
}

/** Escribir un monto en pesos en una hoja (con «Usar este precio»). */
export function HojaMonto({ titulo, ayuda, centavos, onCerrar, onListo, textoBoton = 'Usar este precio' }: { titulo: string; ayuda: string; centavos: number | null; onCerrar(): void; onListo(c: number): void; textoBoton?: string }) {
  const [texto, setTexto] = useState(centavos !== null ? String(centavos / 100).replace('.', ',') : '');
  const [error, setError] = useState<string | null>(null);
  function listo() {
    const c = centavosDesdeTexto(texto);
    if (!c) {
      setError('Escribí el monto en pesos.');
      return document.getElementById('hoja-monto')?.focus();
    }
    onListo(c);
  }
  return (
    <Hoja
      abierta
      titulo={titulo}
      onCerrar={onCerrar}
      pie={
        <Boton icono="check" onClick={listo}>
          {textoBoton}
        </Boton>
      }
    >
      <div className="ui-edicion">
        <Campo id="hoja-monto" etiqueta={titulo} prefijo="$" inputMode="decimal" autoComplete="off" value={texto} ayuda={ayuda} error={error} onChange={(e) => setTexto(e.target.value)} />
      </div>
    </Hoja>
  );
}
