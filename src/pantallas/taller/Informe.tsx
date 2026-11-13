'use client';
// T-Informe (fase H1.4, pasado al kit v3 en el lote 2.4): cargás las mediciones de tus instrumentos y el estado del
// tablero; el semáforo (con palabras, no solo color) y las recomendaciones salen solos; agregás fotos (achicadas y sin
// metadatos, en el teléfono) y observaciones, y lo imprimís (o guardás en PDF) o lo compartís. Sin datos del cliente.
// No es un certificado. Guardarlo en el trabajo (adjunto `informe_taller`) queda para el cierre de la ola 2.
import { api } from '@handyx/origen-datos';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { fechaLarga } from '../../lib/formato.ts';
import { leerNumero, mostrarNumero } from '../../herramientas/conversor.ts';
import { REVISION } from '../../taller/electricidad.ts';
import { evaluarInforme, MEDICION, MEDICIONES, PUNTO_TABLERO, PUNTOS_TABLERO, type EstadoPunto, type Medicion, type PuntoTablero, type Semaforo } from '../../taller/informe.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { AvisoRevisionTecnica, ContadorSemaforo, FilaMedicion, type TonoSemaforo } from '../../ui/moleculas/Herramientas.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './electricidad.css';

const SEMAFORO: Record<Semaforo, { texto: string; tono: TonoSemaforo; chip: 'exito' | 'amarillo' | 'error'; icono: 'check' | 'alerta' | 'cerrar' }> = {
  bien: { texto: 'Bien', tono: 'bien', chip: 'exito', icono: 'check' },
  atencion: { texto: 'Para revisar', tono: 'revisar', chip: 'amarillo', icono: 'alerta' },
  mal: { texto: 'Hay que corregir', tono: 'mal', chip: 'error', icono: 'cerrar' },
};
const GENERAL: Record<Semaforo, string> = {
  bien: 'La instalación está en buen estado.',
  atencion: 'La instalación funciona, pero hay puntos para mejorar.',
  mal: 'Hay problemas de seguridad para corregir.',
};
const RESPUESTAS = [
  { valor: 'si' as const, texto: 'Sí' },
  { valor: 'no' as const, texto: 'No' },
  { valor: 'no_aplica' as const, texto: 'No aplica' },
];

export function Informe() {
  const [valores, setValores] = useState<Record<Medicion, string>>({ puestaTierra: '', disparoDiferencial: '', aislacion: '', tension: '' });
  const [tablero, setTablero] = useState<Partial<Record<PuntoTablero, EstadoPunto>>>({});
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const entrada = useRef<HTMLInputElement>(null);
  const isla = useIsla();
  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f)), [fotos]);

  const mediciones = Object.fromEntries(
    MEDICIONES.flatMap((m) => {
      const v = leerNumero(valores[m]);
      return v === null ? [] : [[m, v]];
    }),
  ) as Partial<Record<Medicion, number>>;
  const r = evaluarInforme({ mediciones, tablero });
  const hoy = api.ahora().toISOString();
  const cuenta = (e: Semaforo) => r.mediciones.filter((m) => m.estado === e).length;

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
      ...r.mediciones.map((m) => `• ${MEDICION[m.medicion].texto}: ${mostrarNumero(m.valor, 2)} ${MEDICION[m.medicion].unidad} (${SEMAFORO[m.estado].texto})`),
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
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Informe eléctrico" subtitulo="Electricidad" hrefVolver={RUTAS.tallerElectricidad.ruta} />}
      accion={
        <AccionFija>
          <div className="el-acciones">
            <Boton variante="contorno" icono="enviar" onClick={() => void compartir()}>
              Compartir
            </Boton>
            <Boton icono="documento" onClick={() => window.print()}>
              Imprimir o guardar en PDF
            </Boton>
          </div>
        </AccionFija>
      }
    >
      <ContadorSemaforo bien={cuenta('bien')} revisar={cuenta('atencion')} mal={cuenta('mal')} />
      <Tarjeta como="section" etiqueta="Mediciones">
        <Etiqueta como="h2">Mediciones</Etiqueta>
        <p className="el-nota">Cargá lo que midieron tus instrumentos. Lo que no mediste, dejalo vacío.</p>
        {MEDICIONES.map((m) => {
          const fila = r.mediciones.find((x) => x.medicion === m);
          return (
            <div key={m} className="el-medicion">
              <Campo etiqueta={`${MEDICION[m].texto} (${MEDICION[m].unidad})`} inputMode="decimal" autoComplete="off" value={valores[m]} onChange={(e) => setValores((s) => ({ ...s, [m]: e.target.value }))} ayuda={`${MEDICION[m].instrumento} · ${MEDICION[m].referencia}`} />
              {fila ? (
                <Chip tono={SEMAFORO[fila.estado].chip} icono={SEMAFORO[fila.estado].icono}>
                  {SEMAFORO[fila.estado].texto}
                </Chip>
              ) : null}
            </div>
          );
        })}
      </Tarjeta>

      <Tarjeta como="section" etiqueta="Estado del tablero">
        <Etiqueta como="h2">Estado del tablero</Etiqueta>
        {PUNTOS_TABLERO.map((p) => (
          <div key={p} className="el-punto">
            <p aria-hidden="true">{PUNTO_TABLERO[p].texto}</p>
            <Segmento etiqueta={PUNTO_TABLERO[p].texto} opciones={RESPUESTAS} valor={tablero[p] ?? ('' as EstadoPunto)} onCambio={(v) => setTablero((t) => ({ ...t, [p]: v }))} />
          </div>
        ))}
      </Tarjeta>

      <Tarjeta como="section" etiqueta="Fotos y observaciones">
        <Etiqueta como="h2">Fotos y observaciones</Etiqueta>
        <Campo etiqueta="Referencia del trabajo (sin datos del cliente)" value={referencia} maxLength={60} placeholder="Ej.: tablero principal" onChange={(e) => setReferencia(e.target.value)} />
        {fotos.length ? (
          <div className="el-fotos">
            {fotos.map((f, i) => (
              <img key={f} src={f} alt={`Foto ${i + 1} del informe`} />
            ))}
          </div>
        ) : null}
        <input ref={entrada} className="visualmente-oculto" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Fotos del informe" onChange={(e) => void agregarFotos(e.target.files)} />
        {fotos.length < 4 ? (
          <Boton variante="contorno" icono="camara" onClick={() => entrada.current?.click()}>
            Agregar fotos ({fotos.length} de 4)
          </Boton>
        ) : null}
        <AreaTexto etiqueta="Observaciones" valor={observaciones} onCambio={setObservaciones} maximo={600} />
      </Tarjeta>

      <article className="el-informe el-imprimible" aria-labelledby="el-inf-t">
        <header className="el-informe__cab">
          <Etiqueta>Handyx · Informe eléctrico</Etiqueta>
          <h2 id="el-inf-t">{r.general ? GENERAL[r.general] : 'Cargá mediciones para ver el resultado'}</h2>
          <p className="el-nota">
            {fechaLarga(hoy)}
            {referencia.trim() ? ` · ${referencia.trim()}` : ''}
          </p>
        </header>
        {r.mediciones.map((m) => (
          <FilaMedicion key={m.medicion} titulo={MEDICION[m.medicion].texto} valor={`${mostrarNumero(m.valor, 2)} ${MEDICION[m.medicion].unidad}`} tono={SEMAFORO[m.estado].tono} texto={SEMAFORO[m.estado].texto} />
        ))}
        {r.recomendaciones.length ? (
          <>
            <h3>Recomendaciones</h3>
            <ol className="el-recomendaciones">
              {r.recomendaciones.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </>
        ) : null}
        {observaciones.trim() ? <p className="el-informe__obs">{observaciones.trim()}</p> : null}
        {fotos.length ? (
          <div className="el-fotos">
            {fotos.map((f, i) => (
              <img key={f} src={f} alt={`Foto ${i + 1} del informe impreso`} />
            ))}
          </div>
        ) : null}
        <p className="el-nota">Este informe no reemplaza un certificado de instalación ni la documentación oficial. Sin datos del cliente.</p>
      </article>
      <AvisoRevisionTecnica>{REVISION.aviso}</AvisoRevisionTecnica>
    </PantallaSecundaria>
  );
}
