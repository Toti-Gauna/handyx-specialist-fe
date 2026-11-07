'use client';
// Armador de tablero (fase H1): agregás protecciones, se encastran en el riel DIN en 3D, y sale el gabinete, la lista de
// materiales y las etiquetas. Inspirado en los configuradores de ABB, Schneider y Hager. La lista es la representación
// accesible del tablero; la vista 3D es un apoyo visual.
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { Aviso } from '../../components/ui.tsx';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { armarTablero, DISPOSITIVO, etiquetas, materialesTablero, tableroInicial, TIPOS_DISPOSITIVO, type Dispositivo, type TipoDispositivo } from '../../taller/tablero.ts';
import { Tablero3D, type ManejoTablero } from './Tablero3D.tsx';
import './taller.css';

/** AR Quick Look: solo Safari en iPhone y iPad lo soporta (así lo detecta Apple). */
function soportaQuickLook(): boolean {
  if (typeof document === 'undefined') return false;
  const a = document.createElement('a');
  return Boolean(a.relList?.supports?.('ar'));
}

export function Tablero() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(tableroInicial);
  const [siguiente, setSiguiente] = useState(10);
  const [nuevoTipo, setNuevoTipo] = useState<TipoDispositivo>('termica_1p');
  const [quickLook, setQuickLook] = useState(false);
  const [ar, setAr] = useState<{ modelo: string; miniatura: string } | null>(null);
  const vista = useRef<ManejoTablero>(null);
  const isla = useIsla();
  const a = armarTablero(dispositivos);
  const materiales = materialesTablero(dispositivos);
  const textos = etiquetas(dispositivos);

  useEffect(() => setQuickLook(soportaQuickLook()), []);
  useEffect(
    () => () => {
      if (ar) {
        URL.revokeObjectURL(ar.modelo);
        URL.revokeObjectURL(ar.miniatura);
      }
    },
    [ar],
  );

  // Si cambia el tablero, la vista en la pared preparada ya no corresponde.
  useEffect(() => setAr(null), [dispositivos]);

  const cambiar = (id: string, parcial: Partial<Dispositivo>) => setDispositivos((ds) => ds.map((d) => (d.id === id ? { ...d, ...parcial } : d)));
  const quitar = (id: string) => setDispositivos((ds) => ds.filter((d) => d.id !== id));
  function mover(id: string, paso: -1 | 1) {
    setDispositivos((ds) => {
      const i = ds.findIndex((d) => d.id === id);
      const j = i + paso;
      if (i < 0 || j < 0 || j >= ds.length) return ds;
      const a = ds[i];
      const b = ds[j];
      if (!a || !b) return ds;
      const copia = [...ds];
      copia[i] = b;
      copia[j] = a;
      return copia;
    });
  }
  function agregar() {
    const calibres = DISPOSITIVO[nuevoTipo].calibres;
    setDispositivos((ds) => [...ds, { id: `d${siguiente}`, tipo: nuevoTipo, calibre: calibres.includes(16) ? 16 : (calibres[0] ?? null), circuito: '' }]);
    setSiguiente((n) => n + 1);
  }

  async function compartir() {
    const png = await vista.current?.imagen();
    const texto = `Tablero de ${a.gabinete ?? 'más de 48'} módulos\n${textos.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    try {
      const archivo = png ? new File([png], 'tablero.png', { type: 'image/png' }) : null;
      if (archivo && navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo], text: texto, title: 'Tablero' });
      else if (navigator.share) await navigator.share({ text: texto, title: 'Tablero' });
      else {
        await navigator.clipboard.writeText(texto);
        isla({ titulo: 'Copiamos el detalle del tablero', texto: 'Pegalo en el chat con tu cliente.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  async function prepararAr() {
    try {
      const [modelo, foto] = await Promise.all([vista.current?.usdz(), vista.current?.imagen()]);
      if (!modelo || !foto) return;
      setAr({ modelo: URL.createObjectURL(modelo), miniatura: URL.createObjectURL(foto) });
    } catch {
      isla({ titulo: 'No pudimos preparar la vista en tu pared', texto: 'Probá de nuevo.', icono: 'alerta', tono: 'amarillo' });
    }
  }

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Armador de tablero" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <section className="tl-escena" aria-label="Vista del tablero en 3D (girala con el dedo)">
        <Tablero3D ref={vista} dispositivos={dispositivos} />
        <p className="tl-escena__pie">
          {a.gabinete ? `Gabinete de ${a.gabinete} módulos · usás ${a.modulosUsados} + ${a.reserva} de reserva` : `${a.modulosUsados} módulos: hace falta un tablero a medida`}
        </p>
      </section>
      <div className="tl-acciones">
        <button type="button" className="boton boton--claro" onClick={() => void compartir()}>
          <Icono nombre="enviar" /> Compartir
        </button>
        {quickLook ? (
          ar ? (
            // AR Quick Look exige un enlace rel="ar" con una sola imagen adentro.
            <a className="tl-ar" rel="ar" href={ar.modelo}>
              <img src={ar.miniatura} alt="Ver el tablero en tu pared con realidad aumentada" width={96} height={72} />
            </a>
          ) : (
            <button type="button" className="boton" onClick={() => void prepararAr()}>
              <Icono nombre="camara" /> Preparar vista en la pared
            </button>
          )
        ) : null}
      </div>
      {a.avisos.map((t) => (
        <Aviso key={t} tono="aviso" icono="alerta">
          {t}
        </Aviso>
      ))}

      <section className="tl-tarjeta" aria-labelledby="tl-disp-t">
        <h2 id="tl-disp-t" className="tl-tarjeta__titulo">Protecciones, de izquierda a derecha</h2>
        <ol className="tl-dispositivos">
          {dispositivos.map((d, i) => {
            const t = DISPOSITIVO[d.tipo];
            return (
              <li key={d.id} className="tl-disp">
                <div className="tl-disp__cab">
                  <strong>{i + 1}. {t.corto}</strong>
                  <span className="tl-disp__mod">{t.modulos} {t.modulos === 1 ? 'módulo' : 'módulos'}</span>
                </div>
                <div className="tl-disp__campos">
                  {t.calibres.length ? (
                    <label className="tl-mini">
                      <span>Calibre</span>
                      <select value={d.calibre ?? ''} onChange={(e) => cambiar(d.id, { calibre: Number(e.target.value) })}>
                        {t.calibres.map((c) => (
                          <option key={c} value={c}>{c} A</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="tl-mini tl-mini--ancho">
                    <span>Qué protege</span>
                    <input value={d.circuito} placeholder="Ej.: Tomas cocina" maxLength={40} onChange={(e) => cambiar(d.id, { circuito: e.target.value })} />
                  </label>
                </div>
                <div className="tl-disp__botones">
                  <button type="button" className="hx-circulo" aria-label={`Mover ${t.corto} ${i + 1} a la izquierda`} disabled={i === 0} onClick={() => mover(d.id, -1)}>
                    <Icono nombre="izquierda" />
                  </button>
                  <button type="button" className="hx-circulo" aria-label={`Mover ${t.corto} ${i + 1} a la derecha`} disabled={i === dispositivos.length - 1} onClick={() => mover(d.id, 1)}>
                    <Icono nombre="derecha" />
                  </button>
                  <button type="button" className="hx-circulo" aria-label={`Quitar ${t.corto} ${i + 1}`} onClick={() => quitar(d.id)}>
                    <Icono nombre="tacho" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="tl-agregar">
          <label htmlFor="tl-nuevo-disp">Agregar al tablero</label>
          <div className="tl-agregar__fila">
            <select id="tl-nuevo-disp" value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value as TipoDispositivo)}>
              {TIPOS_DISPOSITIVO.map((t) => (
                <option key={t} value={t}>{DISPOSITIVO[t].texto}</option>
              ))}
            </select>
            <button type="button" className="boton boton--claro" onClick={agregar}>
              <Icono nombre="mas" /> Agregar
            </button>
          </div>
        </div>
      </section>

      <section className="tl-tarjeta" aria-labelledby="tl-mat-t">
        <h2 id="tl-mat-t" className="tl-tarjeta__titulo">Lista de materiales</h2>
        <ul className="tl-lista-bocas">
          {materiales.map((m) => (
            <li key={m.descripcion}>
              <span>{m.descripcion}</span>
              <strong>× {m.cantidad}</strong>
            </li>
          ))}
        </ul>
        <p className="tl-nota">Pronto: pasar esta lista al presupuestador con tus precios.</p>
      </section>

      <section className="tl-tarjeta" aria-labelledby="tl-et-t">
        <h2 id="tl-et-t" className="tl-tarjeta__titulo">Etiquetas</h2>
        <ol className="tl-etiquetas">
          {textos.map((t, i) => (
            <li key={`${dispositivos[i]?.id}`}>{t}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
