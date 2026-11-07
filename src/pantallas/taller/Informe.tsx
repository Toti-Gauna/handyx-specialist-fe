'use client';
// Informe eléctrico (fase H1.4): cargás las mediciones de tus instrumentos y el estado del tablero; el semáforo y las
// recomendaciones salen solos; agregás fotos y observaciones, y lo imprimís (o guardás en PDF) o lo compartís.
// Sin datos del cliente. No es un certificado. Guardarlo en el trabajo llega con el backend del Taller (H0.6).
import { api } from '@handyx/origen-datos';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { AreaTexto } from '../../components/ui.tsx';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { fechaLarga } from '../../lib/formato.ts';
import { REVISION } from '../../taller/electricidad.ts';
import { evaluarInforme, MEDICION, MEDICIONES, PUNTO_TABLERO, PUNTOS_TABLERO, type EstadoPunto, type Medicion, type PuntoTablero, type Semaforo } from '../../taller/informe.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { AvisoRevision, CampoNumero, mostrar, numero, Opciones } from './piezas.tsx';
import './taller.css';

const SEMAFORO: Record<Semaforo, { texto: string; icono: 'checkCirculo' | 'alerta' | 'prohibido' }> = {
  bien: { texto: 'Bien', icono: 'checkCirculo' },
  atencion: { texto: 'Para revisar', icono: 'alerta' },
  mal: { texto: 'Hay que corregir', icono: 'prohibido' },
};
const GENERAL: Record<Semaforo, string> = {
  bien: 'La instalación está en buen estado.',
  atencion: 'La instalación funciona, pero hay puntos para mejorar.',
  mal: 'Hay problemas de seguridad para corregir.',
};

function Estado({ e }: { e: Semaforo }) {
  return (
    <span className={`tl-chip-estado tl-chip-estado--${e}`}>
      <Icono nombre={SEMAFORO[e].icono} /> {SEMAFORO[e].texto}
    </span>
  );
}

export function Informe() {
  const [valores, setValores] = useState<Record<Medicion, string>>({ puestaTierra: '', disparoDiferencial: '', aislacion: '', tension: '' });
  const [tablero, setTablero] = useState<Partial<Record<PuntoTablero, EstadoPunto>>>({});
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const entrada = useRef<HTMLInputElement>(null);
  const isla = useIsla();
  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f)), [fotos]);

  const mediciones = Object.fromEntries(MEDICIONES.flatMap((m) => {
    const v = numero(valores[m]);
    return v === null ? [] : [[m, v]];
  })) as Partial<Record<Medicion, number>>;
  const r = evaluarInforme({ mediciones, tablero });
  const hoy = api.ahora().toISOString();

  async function agregarFotos(lista: FileList | null) {
    if (!lista) return;
    const nuevas: string[] = [];
    for (const f of [...lista].slice(0, 4 - fotos.length)) {
      try {
        nuevas.push(URL.createObjectURL(await prepararFoto(f)));
      } catch {
        // Un archivo que no es imagen se ignora.
      }
    }
    setFotos((fs) => [...fs, ...nuevas]);
  }

  async function compartir() {
    const t = [
      `Informe eléctrico · ${fechaLarga(hoy)}${referencia.trim() ? ` · ${referencia.trim()}` : ''}`,
      r.general ? GENERAL[r.general] : 'Sin mediciones cargadas.',
      ...r.mediciones.map((m) => `• ${MEDICION[m.medicion].texto}: ${mostrar(m.valor, 2)} ${MEDICION[m.medicion].unidad} (${SEMAFORO[m.estado].texto})`),
      ...(r.recomendaciones.length ? ['Recomendaciones:', ...r.recomendaciones.map((x) => `• ${x}`)] : []),
      ...(observaciones.trim() ? [`Observaciones: ${observaciones.trim()}`] : []),
      'Este informe no reemplaza un certificado de instalación.',
    ].join('\n');
    try {
      if (navigator.share) await navigator.share({ text: t, title: 'Informe eléctrico' });
      else {
        await navigator.clipboard.writeText(t);
        isla({ titulo: 'Copiamos el informe', texto: 'Pegalo en el chat con tu cliente.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Informe eléctrico" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <section className="tl-tarjeta" aria-labelledby="tl-med-t">
        <h2 id="tl-med-t" className="tl-tarjeta__titulo">Mediciones</h2>
        <p className="tl-nota">Cargá lo que midieron tus instrumentos. Lo que no mediste, dejalo vacío.</p>
        {MEDICIONES.map((m) => {
          const fila = r.mediciones.find((x) => x.medicion === m);
          return (
            <div key={m} className="tl-medicion">
              <CampoNumero etiqueta={MEDICION[m].texto} unidad={MEDICION[m].unidad} valor={valores[m]} onCambio={(v) => setValores((s) => ({ ...s, [m]: v }))} ayuda={`${MEDICION[m].instrumento} · ${MEDICION[m].referencia}`} />
              {fila ? <Estado e={fila.estado} /> : null}
            </div>
          );
        })}
      </section>

      <section className="tl-tarjeta" aria-labelledby="tl-tab-t">
        <h2 id="tl-tab-t" className="tl-tarjeta__titulo">Estado del tablero</h2>
        {PUNTOS_TABLERO.map((p) => (
          <Opciones key={p} etiqueta={PUNTO_TABLERO[p].texto} opciones={[{ valor: 'si' as const, texto: 'Sí' }, { valor: 'no' as const, texto: 'No' }, { valor: 'no_aplica' as const, texto: 'No aplica' }]} valor={tablero[p] ?? ('' as EstadoPunto)} onCambio={(v) => setTablero((t) => ({ ...t, [p]: v }))} />
        ))}
      </section>

      <section className="tl-tarjeta" aria-labelledby="tl-fotos-t">
        <h2 id="tl-fotos-t" className="tl-tarjeta__titulo">Fotos y observaciones</h2>
        <label className="tl-mini tl-mini--ancho">
          <span>Referencia del trabajo (sin datos del cliente)</span>
          <input value={referencia} maxLength={60} placeholder="Ej.: tablero principal" onChange={(e) => setReferencia(e.target.value)} />
        </label>
        <div className="tl-fotos">
          {fotos.map((f, i) => (
            <img key={f} src={f} alt={`Foto ${i + 1} del informe`} />
          ))}
        </div>
        <input ref={entrada} className="visualmente-oculto" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Fotos del informe" onChange={(e) => void agregarFotos(e.target.files)} />
        {fotos.length < 4 ? (
          <button type="button" className="boton boton--claro" onClick={() => entrada.current?.click()}>
            <Icono nombre="camara" /> Agregar fotos ({fotos.length} de 4)
          </button>
        ) : null}
        <AreaTexto etiqueta="Observaciones" value={observaciones} maxLength={600} rows={3} onChange={(e) => setObservaciones(e.target.value)} />
      </section>

      <article className="tl-informe tl-imprimible" aria-labelledby="tl-inf-t">
        <header className="tl-informe__cab">
          <p className="tl-informe__marca">Handyx · Informe eléctrico</p>
          <h2 id="tl-inf-t" className="tl-informe__titulo">{r.general ? GENERAL[r.general] : 'Cargá mediciones para ver el resultado'}</h2>
          <p className="tl-nota">{fechaLarga(hoy)}{referencia.trim() ? ` · ${referencia.trim()}` : ''}</p>
          {r.general ? <Estado e={r.general} /> : null}
        </header>
        {r.mediciones.length ? (
          <ul className="tl-lista-bocas">
            {r.mediciones.map((m) => (
              <li key={m.medicion}>
                <span>{MEDICION[m.medicion].texto}</span>
                <strong>{mostrar(m.valor, 2)} {MEDICION[m.medicion].unidad} · {SEMAFORO[m.estado].texto}</strong>
              </li>
            ))}
          </ul>
        ) : null}
        {r.recomendaciones.length ? (
          <>
            <h3 className="tl-informe__sub">Recomendaciones</h3>
            <ol className="tl-pasos">
              {r.recomendaciones.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </>
        ) : null}
        {observaciones.trim() ? <p className="tl-informe__obs">{observaciones.trim()}</p> : null}
        {fotos.length ? (
          <div className="tl-fotos">
            {fotos.map((f, i) => (
              <img key={f} src={f} alt={`Foto ${i + 1} del informe`} />
            ))}
          </div>
        ) : null}
        <p className="tl-nota">Este informe no reemplaza un certificado de instalación ni la documentación oficial.</p>
      </article>
      <div className="tl-acciones">
        <button type="button" className="boton boton--claro" onClick={() => window.print()}>
          <Icono nombre="etiqueta" /> Imprimir o guardar en PDF
        </button>
        <button type="button" className="boton" onClick={() => void compartir()}>
          <Icono nombre="enviar" /> Compartir
        </button>
      </div>
      <AvisoRevision texto={REVISION.aviso} />
    </div>
  );
}
