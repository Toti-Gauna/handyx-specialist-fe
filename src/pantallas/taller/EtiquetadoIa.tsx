'use client';
// Etiquetado de tablero con IA (fase H1.3). Sacás una foto del tablero; el teléfono la achica y le borra los metadatos;
// la IA propone cada protección y su circuito; vos corregís y la abrís en el armador o imprimís las etiquetas.
// Sin proveedor de IA autorizado, la API responde 503 y se dice. En datos de prueba el resultado es simulado.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, ChipTexto } from '../../components/ui.tsx';
import type { SugerenciaTablero } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { prepararFoto } from '../../taller/privacidad.ts';
import { DISPOSITIVO, etiquetas, type Dispositivo } from '../../taller/tablero.ts';
import { dejarParaTablero } from '../../taller/traspaso.ts';
import { useEntrada } from './piezas.tsx';
import './taller.css';

const CONFIANZA = { alta: { texto: 'Se lee bien', tono: 'exito' }, media: { texto: 'Revisalo', tono: 'aviso' }, baja: { texto: 'No se lee', tono: 'error' } } as const;

export function EtiquetadoIa() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [sugerencia, setSugerencia] = useState<SugerenciaTablero | null>(null);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const analizar = useAccion();
  const lista = useEntrada<HTMLOListElement>('.tl-disp');

  useEffect(() => () => void (vista && URL.revokeObjectURL(vista)), [vista]);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setSugerencia(null);
    analizar.limpiar();
    try {
      const lista = await prepararFoto(archivo);
      setFoto(lista);
      setVista(URL.createObjectURL(lista));
    } catch {
      setFoto(archivo);
      setVista(URL.createObjectURL(archivo));
    }
  }

  async function mandar() {
    if (!foto) return;
    const r = await analizar.ejecutar(() => api.iaTablero(foto));
    if (r.ok) {
      setSugerencia(r.valor);
      setDispositivos(r.valor.dispositivos.map((d, i) => ({ id: `ia${i}`, tipo: d.tipo, calibre: d.calibre, circuito: d.circuito })));
    }
  }

  function abrirEnArmador() {
    dejarParaTablero(dispositivos);
    router.push(RUTAS.tallerTablero.ruta);
  }

  const cambiar = (id: string, circuito: string) => setDispositivos((ds) => ds.map((d) => (d.id === id ? { ...d, circuito } : d)));
  const noDisponible = analizar.fallo?.status === 503;

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Etiquetas con IA" atras={RUTAS.tallerElectricidad.ruta} textoAtras="Volver a Electricidad" acciones={null} />
      <Aviso tono="azul" icono="escudo" titulo="Tu foto se cuida">
        Antes de mandarla, el teléfono la achica y le borra la ubicación y los datos del celular. Sacá solo el tablero: sin personas ni papeles.
      </Aviso>
      {api.origen === 'mock' ? <p className="tl-nota">En los datos de prueba, el resultado de la IA es simulado.</p> : null}

      <section className="tl-escena tl-foto" aria-label="Vista previa">
        {vista ? <img src={vista} alt="La foto del tablero que elegiste" /> : (
          <div className="tl-foto__vacia">
            <Icono nombre="camara" />
            <p>Sacale una foto de frente, con la tapa abierta y buena luz.</p>
          </div>
        )}
      </section>
      <input ref={entrada} className="visualmente-oculto" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="Foto del tablero" onChange={(e) => void elegir(e.target.files?.[0])} />
      <div className="tl-acciones">
        <button type="button" className="boton boton--claro" onClick={() => entrada.current?.click()}>
          <Icono nombre="camara" /> {vista ? 'Otra foto' : 'Sacar o elegir foto'}
        </button>
        <button type="button" className="boton" disabled={!foto || analizar.pendiente} onClick={() => void mandar()}>
          {analizar.pendiente ? 'Leyendo el tablero…' : 'Leer el tablero'}
        </button>
      </div>
      {noDisponible ? (
        <Aviso tono="aviso" icono="alerta" titulo="La IA todavía no está disponible">
          Mientras tanto, armá el tablero a mano en el armador: tarda un minuto.
        </Aviso>
      ) : analizar.fallo ? (
        <ErrorCaja fallo={analizar.fallo} onReintentar={() => void mandar()} />
      ) : null}

      {sugerencia ? (
        <>
          {sugerencia.avisos.map((a) => (
            <Aviso key={a} tono="aviso" icono="alerta">{a}</Aviso>
          ))}
          <section className="tl-tarjeta" aria-labelledby="tl-ia-t">
            <h2 id="tl-ia-t" className="tl-tarjeta__titulo">Lo que encontró, de izquierda a derecha</h2>
            <p className="tl-nota">Revisá cada una: la IA propone y vos confirmás.</p>
            <ol className="tl-dispositivos" ref={lista}>
              {dispositivos.map((d, i) => {
                const conf = CONFIANZA[sugerencia.dispositivos[i]?.confianza ?? 'media'];
                return (
                  <li key={d.id} className="tl-disp">
                    <div className="tl-disp__cab">
                      <strong>{i + 1}. {DISPOSITIVO[d.tipo].corto}{d.calibre ? ` · ${d.calibre} A` : ''}</strong>
                      <ChipTexto tono={conf.tono} icono={conf.tono === 'exito' ? 'checkCirculo' : 'alerta'}>{conf.texto}</ChipTexto>
                    </div>
                    <label className="tl-mini tl-mini--ancho">
                      <span>Qué protege</span>
                      <input value={d.circuito} placeholder="Ej.: Tomas cocina" maxLength={40} onChange={(e) => cambiar(d.id, e.target.value)} />
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>
          <section className="tl-tarjeta tl-imprimible" aria-labelledby="tl-et-ia-t">
            <h2 id="tl-et-ia-t" className="tl-tarjeta__titulo">Etiquetas</h2>
            <ol className="tl-etiquetas">
              {etiquetas(dispositivos).map((t, i) => (
                <li key={dispositivos[i]?.id}>{t}</li>
              ))}
            </ol>
          </section>
          <div className="tl-acciones">
            <button type="button" className="boton boton--claro" onClick={() => window.print()}>
              <Icono nombre="etiqueta" /> Imprimir etiquetas
            </button>
            <button type="button" className="boton" onClick={abrirEnArmador}>
              Abrir en el armador 3D
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
