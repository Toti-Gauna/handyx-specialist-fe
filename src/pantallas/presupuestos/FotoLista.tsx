'use client';
// Foto de la lista del corralón (H0-PreciosFoto y H0-PreciosRevisar, lote 2.2), en tres pasos dentro de la misma
// pantalla: sacar la foto, ver lo que se entendió y revisar cada precio antes de guardarlo.
// - La foto se lee EN EL TELÉFONO (detector de texto del navegador) y nunca se manda: al servidor van solo las filas.
// - Si el teléfono no puede leer, o lee mal, se carga a mano. Lo que no se entendió queda «Revisá» y no se guarda hasta
//   que lo corrijas. Revisar no guarda nada: solo compara con tu lista (qué sube, baja, queda igual o es nuevo).
import { api, lectorListaPrueba } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { LecturaLista, RevisionLectura } from '../../contracts/presupuestos.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { centavosDesdeTexto, pesosDesdeCentavos, plural } from '../../lib/formato.ts';
import { entendidas, interpretarLista, nombrePropio, type FilaLeida, type ListaLeida } from '../../presupuestos/lectura.ts';
import { lectorDelTelefono } from '../../presupuestos/lector.ts';
import { diaMes, resultadoLectura } from '../../presupuestos/vista.ts';
import { Boton, BotonEnlace, BotonIcono } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { ListaPrecios as HojaDibujada } from '../../ui/ilustraciones/ListaPrecios.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { CifraCambio, FilaCasilla } from '../../ui/moleculas/Materiales.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { hoyLocal } from './comunes.tsx';
import './presupuestos.css';

type Paso = 'foto' | 'leida' | 'revisar';

export function FotoLista() {
  const lector = useMemo(() => lectorListaPrueba ?? lectorDelTelefono(), []);
  const [paso, setPaso] = useState<Paso>('foto');
  const [leida, setLeida] = useState<ListaLeida | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const hoy = hoyLocal();

  async function leer(foto: Blob) {
    if (!lector) return;
    setLeyendo(true);
    setError(null);
    try {
      const l = interpretarLista(await lector.leer(foto));
      setLeida({ ...l, proveedor: l.proveedor ? nombrePropio(l.proveedor) : null });
      setPaso('leida');
    } catch {
      setError('No pudimos leer la foto. Probá de nuevo con más luz, o cargá los precios a mano.');
    } finally {
      setLeyendo(false);
    }
  }

  function sacarFoto() {
    if (!lector) return;
    if (lector.simulado) return void leer(new Blob());
    archivo.current?.click();
  }

  const entrada = (
    <input
      ref={archivo}
      type="file"
      accept="image/*"
      capture="environment"
      className="visualmente-oculto"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) void leer(f);
      }}
    />
  );

  if (paso === 'revisar' && leida) return <Revisar leida={leida} hoy={hoy} onVolver={() => setPaso('leida')} />;

  if (paso === 'leida' && leida) {
    const n = entendidas(leida);
    return (
      <div className="pr-oscura">
        <PantallaSecundaria
          barra={<BarraCompacta titulo="Lo que leímos" onVolver={() => setPaso('foto')} accion={<Chip tono="amarillo" icono="check">{plural(n, 'precio encontrado', 'precios encontrados')}</Chip>} />}
          accion={
            <AccionFija>
              <div className="pr-fila-acciones">
                <BotonIcono icono="camara" tono="vidrio" etiqueta="Sacar otra foto" disabled={leyendo} onClick={sacarFoto} />
                <Boton variante="amarilla" disabled={n === 0} onClick={() => setPaso('revisar')}>
                  {n === 0 ? 'No encontramos precios' : `Revisar ${plural(n, 'precio', 'precios')}`}
                </Boton>
              </div>
            </AccionFija>
          }
        >
          <HojaDibujada renglones={leida.filas.map((f) => f.centavos !== null)} armar tam="grande" />
          <h2 className="pr-oscura__titulo">{`${leida.proveedor ?? 'Tu lista'} · ${diaMes(hoy)}`}</h2>
          <p className="pr-oscura__texto">Se lee en tu teléfono: la foto no sale de acá. Las filas marcadas son las que entendimos.</p>
          {n === 0 ? <p className="pr-oscura__texto">Probá con más luz y la hoja derecha, o cargá los precios a mano.</p> : null}
          {lector?.simulado ? <AvisoCaja tono="prueba">Lectura de prueba: no se usó ninguna foto.</AvisoCaja> : null}
          {entrada}
        </PantallaSecundaria>
      </div>
    );
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Foto de la lista" subtitulo="Para cargar precios rápido" hrefVolver={RUTAS.precios.ruta} />}
      accion={
        lector ? (
          <AccionFija>
            <Boton icono="camara" ocupado={leyendo} textoOcupado="Leyendo la lista…" onClick={sacarFoto}>
              {lector.simulado ? 'Sacar foto de prueba' : 'Sacar la foto'}
            </Boton>
          </AccionFija>
        ) : (
          <AccionFija>
            <BotonEnlace href={RUTAS.presupuestoMaterialNuevo.ruta} icono="lapiz">
              Cargar un precio a mano
            </BotonEnlace>
          </AccionFija>
        )
      }
    >
      <HojaDibujada renglones={[true, true, false, true, true, true, false, true]} tam="medio" />
      <h2 className="pr-subtitulo">Sacale una foto a la lista del corralón</h2>
      <ul className="pr-consejos">
        <li>Con buena luz y la hoja derecha.</li>
        <li>Una hoja por foto, que se vean los precios.</li>
        <li>Después revisás cada precio antes de guardarlo.</li>
      </ul>
      <AvisoCaja tono="info" icono="escudo">
        Se lee en tu teléfono: la foto no sale de acá y no se guarda. Solo se guardan los precios que confirmes.
      </AvisoCaja>
      {!lector ? (
        <AvisoCaja tono="info" icono="alerta" titulo="Tu teléfono no puede leer la lista">
          Cargá los precios a mano: es un momento y quedan en tu lista.
        </AvisoCaja>
      ) : null}
      {error ? <AvisoCaja tono="error">{error}</AvisoCaja> : null}
      {entrada}
    </PantallaSecundaria>
  );
}

interface FilaRevision extends FilaLeida {
  clave: string;
  corregida: boolean;
}

/** H0-PreciosRevisar: qué sube, baja, queda igual o es nuevo; lo dudoso se corrige a mano antes de guardarlo. */
function Revisar({ leida, hoy, onVolver }: { leida: ListaLeida; hoy: string; onVolver(): void }) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaRevision[]>(() => leida.filas.map((f, i) => ({ ...f, clave: `f${i}`, corregida: false })));
  const [proveedor, setProveedor] = useState(leida.proveedor ?? '');
  const [revision, setRevision] = useState<{ datos: RevisionLectura; claves: string[] } | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string> | null>(null);
  const [corrigiendo, setCorrigiendo] = useState<FilaRevision | null>(null);
  const [errorProveedor, setErrorProveedor] = useState<string | null>(null);
  const comparar = useAccion();
  const guardar = useAccion();

  const legibles = filas.filter((f) => f.centavos !== null);
  const lectura = (fs: FilaRevision[]): LecturaLista => ({
    proveedor: proveedor.trim() || 'Lista sin nombre',
    fecha: hoy,
    filas: fs.filter((f) => f.centavos !== null).map((f) => ({ nombre: f.nombre, unidad: f.unidad, costo: { centavos: f.centavos ?? 0, moneda: 'ARS' }, precioId: null })),
  });

  async function revisar(fs: FilaRevision[], nuevas?: Set<string>) {
    const r = await comparar.ejecutar(() => api.revisarLectura(lectura(fs)));
    if (!r.ok) return;
    const claves = fs.filter((f) => f.centavos !== null).map((f) => f.clave);
    setRevision({ datos: r.valor, claves });
    // Se marca todo lo que se entendió, menos lo que el servidor pide revisar (un cambio de más de la mitad).
    setMarcadas((prev) => {
      const s = new Set(prev ?? []);
      r.valor.filas.forEach((x, i) => {
        const c = claves[i];
        if (c && prev === null && x.resultado !== 'revisar') s.add(c);
      });
      for (const c of nuevas ?? []) s.add(c);
      return s;
    });
  }

  // Al entrar se compara una vez con tu lista (sin guardar nada). Si no se entendió ningún precio, no hay qué comparar.
  const primera = useRef(false);
  useEffect(() => {
    if (primera.current) return;
    primera.current = true;
    if (legibles.length > 0) void revisar(filas);
    else {
      setRevision({ datos: { filas: [], presupuestosAfectados: 0 }, claves: [] });
      setMarcadas(new Set());
    }
  });

  if (comparar.fallo && !revision) return <ErrorCaja pantalla fallo={comparar.fallo} onReintentar={() => void revisar(filas)} />;
  if (!revision || !marcadas) return <Cargando texto="Comparando con tu lista…" />;

  const porClave = new Map(revision.claves.map((c, i) => [c, revision.datos.filas[i]]));
  const elegidas = filas.filter((f) => f.centavos !== null && marcadas.has(f.clave));
  const suben = revision.datos.filas.filter((f) => f.resultado === 'sube').length;

  async function guardarTodo() {
    if (!proveedor.trim()) {
      setErrorProveedor('Escribí de qué corralón o ferretería es la lista.');
      document.getElementById('rv-proveedor')?.focus();
      return;
    }
    setErrorProveedor(null);
    const r = await guardar.ejecutar(() => api.guardarLectura(lectura(elegidas), guardar.clave()));
    if (r.ok) router.push(`${RUTAS.precios.ruta}?guardados=${elegidas.length}`);
  }

  function corregir(f: FilaRevision, nombre: string, centavos: number) {
    const nuevas = filas.map((x) => (x.clave === f.clave ? { ...x, nombre, centavos, precioLeido: pesosDesdeCentavos(centavos), corregida: true } : x));
    setFilas(nuevas);
    setCorrigiendo(null);
    void revisar(nuevas, new Set([f.clave]));
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Revisá los precios" subtitulo={`${proveedor.trim() || 'Tu lista'} · ${diaMes(hoy)}`} onVolver={onVolver} />}
      accion={
        <AccionFija>
          <Boton ocupado={guardar.pendiente} textoOcupado="Guardando…" disabled={elegidas.length === 0 || comparar.pendiente} onClick={() => void guardarTodo()}>
            {elegidas.length ? `Guardar ${plural(elegidas.length, 'precio', 'precios')}` : 'Marcá los precios a guardar'}
          </Boton>
        </AccionFija>
      }
    >
      <Campo id="rv-proveedor" etiqueta="De qué corralón es" value={proveedor} maxLength={80} autoComplete="off" error={errorProveedor} onChange={(e) => setProveedor(e.target.value)} />
      <Tarjeta>
        <ul className="pr-lista pr-lista--plana" aria-label="Precios leídos">
          {filas.map((f) => {
            const r = porClave.get(f.clave);
            if (f.centavos === null || !r)
              return (
                <li key={f.clave} className="pr-li">
                  <FilaIcono
                    icono="alerta"
                    titulo={f.nombre}
                    detalle={
                      <span className="pr-detalle__chips">
                        <Chip tono="error" icono="alerta">
                          Revisá
                        </Chip>
                        <span>{`Leímos «${f.precioLeido}»`}</span>
                      </span>
                    }
                    derecha={<span className="pr-corregir">Corregir</span>}
                    onClick={() => setCorrigiendo(f)}
                  />
                </li>
              );
            const e = resultadoLectura(r.resultado, r.variacionBps);
            return (
              <FilaCasilla
                key={f.clave}
                titulo={r.nombre}
                detalle={
                  <Chip tono={e.tono} icono={e.icono}>
                    {e.texto}
                  </Chip>
                }
                derecha={<CifraCambio antes={r.anterior?.centavos ?? null} ahora={r.nuevo.centavos} />}
                marcada={marcadas.has(f.clave)}
                onCambio={(v) => {
                  const s = new Set(marcadas);
                  if (v) s.add(f.clave);
                  else s.delete(f.clave);
                  setMarcadas(s);
                }}
              />
            );
          })}
        </ul>
      </Tarjeta>
      {suben > 0 ? (
        <AvisoCaja tono="info" icono="flechas">
          {`${suben === 1 ? '1 precio sube' : `${suben} precios suben`}.${revision.datos.presupuestosAfectados > 0 ? ' Los presupuestos abiertos con precio que se actualiza te van a avisar.' : ''}`}
        </AvisoCaja>
      ) : null}
      {comparar.fallo ? <ErrorCaja fallo={comparar.fallo} onReintentar={() => void revisar(filas)} /> : null}
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
      {corrigiendo ? <HojaCorregir f={corrigiendo} onCerrar={() => setCorrigiendo(null)} onListo={corregir} /> : null}
    </PantallaSecundaria>
  );
}

function HojaCorregir({ f, onCerrar, onListo }: { f: FilaRevision; onCerrar(): void; onListo(f: FilaRevision, nombre: string, centavos: number): void }) {
  const [nombre, setNombre] = useState(f.nombre);
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState<string | null>(null);
  function listo() {
    const c = centavosDesdeTexto(precio);
    if (!nombre.trim()) return setError('Escribí el nombre del material.');
    if (!c) {
      setError('Escribí el precio en pesos, como figura en la lista.');
      return document.getElementById('rv-precio')?.focus();
    }
    onListo(f, nombre.trim(), c);
  }
  return (
    <Hoja
      abierta
      titulo="Corregir el precio"
      onCerrar={onCerrar}
      pie={
        <Boton onClick={listo} icono="check">
          Usar este precio
        </Boton>
      }
    >
      <div className="ui-edicion">
        <p>{`Leímos «${f.precioLeido}». Mirá la lista y escribí el precio.`}</p>
        <Campo etiqueta="Material" value={nombre} maxLength={120} autoComplete="off" onChange={(e) => setNombre(e.target.value)} />
        <Campo id="rv-precio" etiqueta="Precio" prefijo="$" inputMode="decimal" autoComplete="off" value={precio} error={error} onChange={(e) => setPrecio(e.target.value)} />
      </div>
    </Hoja>
  );
}
