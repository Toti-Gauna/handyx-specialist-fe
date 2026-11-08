'use client';
// T-Escanear (lote 2.4): 30 fotos alrededor de un objeto (termotanque, calefón, aire) → modelo 3D con medidas,
// **armado en el teléfono** (decisión asumida del lote: no se manda ninguna foto). Si el teléfono no puede, se avisa
// antes de empezar o al procesar, y las fotos se descartan. La escala sale de una tarjeta apoyada en el objeto (o de una
// medida que escribís). Paso a paso; todo gesto tiene botón. Con datos de prueba, la cámara y las fotos son simuladas.
import { sensoresPrueba } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ANCHO_PROCESO, armarModelo, ErrorEscaneo, escalaPorAlto, puedeArmar, silueta, TEXTO_MOTIVO, type Fotograma, type MotivoEscaneo, type Paso as PasoProceso } from '../../herramientas/escaneo.ts';
import { escalaTarjeta, type Punto2 } from '../../herramientas/medir.ts';
import { leerNumero } from '../../herramientas/conversor.ts';
import { dejarModelo } from '../../herramientas/modeloEnMemoria.ts';
import { useCamara } from '../../herramientas/useCamara.ts';
import { avanceEscaneo, TOMAS_ESCANEO } from '../../tres/escaneo.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { BarraProgreso } from '../../ui/atomos/Progreso.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AnilloFotos } from '../../ui/moleculas/AnilloFotos.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { MarcarPuntos } from '../../ui/moleculas/MarcarPuntos.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { BotonOscuro, Disparador, PantallaCamara, VideoCamara } from '../../ui/organismos/Camara.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './herramientas.css';

type Paso = 'antes' | 'fotos' | 'escala' | 'armando' | 'error';
interface Primera {
  url: string;
  ancho: number;
  alto: number;
  propia: boolean;
}

function leerPixeles(c: HTMLCanvasElement): Fotograma | null {
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  const d = g.getImageData(0, 0, c.width, c.height);
  return { ancho: d.width, alto: d.height, datos: d.data };
}

/** ¿Este teléfono puede armar el modelo? (lienzo para leer los píxeles y memoria). */
function capacidad(): MotivoEscaneo | null {
  if (sensoresPrueba?.sinProceso) return 'poca_memoria';
  const lienzo = typeof document !== 'undefined' && Boolean(document.createElement('canvas').getContext('2d'));
  const memoria = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined;
  return puedeArmar({ lienzo, ...(memoria ? { memoriaGb: memoria } : {}) });
}

export function Escanear() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('antes');
  const [nombre, setNombre] = useState('');
  const [fotos, setFotos] = useState<Fotograma[]>([]);
  const [primera, setPrimera] = useState<Primera | null>(null);
  const [tarjeta, setTarjeta] = useState<Punto2[]>([]);
  const [elegido, setElegido] = useState(0);
  const [modoEscala, setModoEscala] = useState<'tarjeta' | 'medida'>('tarjeta');
  const [alto, setAlto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoEscaneo | null>(null);
  const [proceso, setProceso] = useState<PasoProceso>({ texto: 'Preparando', fraccion: 0 });
  const [limite] = useState(capacidad);
  const simuladas = useRef<{ fotos: Fotograma[]; primera: Primera & { tarjeta: [Punto2, Punto2] } } | null>(null);
  const cam = useCamara({ activa: paso === 'fotos', simulada: sensoresPrueba !== null });
  const avance = avanceEscaneo(fotos.length);

  useEffect(() => () => {
    if (primera?.propia) URL.revokeObjectURL(primera.url);
  }, [primera]);

  /** Se descarta todo: las fotos no se guardan ni se mandan. */
  function descartar() {
    setFotos([]);
    setPrimera(null);
    setTarjeta([]);
    simuladas.current = null;
  }

  function sacarFoto() {
    if (fotos.length >= TOMAS_ESCANEO) return;
    if (sensoresPrueba) {
      simuladas.current ??= (() => {
        const v = sensoresPrueba.vuelta(TOMAS_ESCANEO, ANCHO_PROCESO);
        return { fotos: v.fotos, primera: { ...v.primera, propia: false } };
      })();
      const f = simuladas.current.fotos[fotos.length];
      if (!f) return;
      if (fotos.length === 0) setPrimera(simuladas.current.primera);
      return setFotos([...fotos, f]);
    }
    const chica = cam.capturar(ANCHO_PROCESO);
    const f = chica ? leerPixeles(chica) : null;
    if (!f) return setError('No pudimos sacar la foto. Probá de nuevo.');
    setError(null);
    if (fotos.length === 0) {
      const grande = cam.capturar(1600);
      grande?.toBlob((b) => b && setPrimera({ url: URL.createObjectURL(b), ancho: grande.width, alto: grande.height, propia: true }), 'image/jpeg', 0.9);
    }
    setFotos([...fotos, f]);
  }

  function irAEscala() {
    if (!primera) return;
    const sim = simuladas.current?.primera;
    const cx = primera.ancho / 2;
    const cy = primera.alto / 2;
    setTarjeta(sim ? [...sim.tarjeta] : [[cx - primera.ancho * 0.06, cy], [cx + primera.ancho * 0.06, cy]]);
    setElegido(0);
    setPaso('escala');
  }

  async function armar() {
    let metrosPorPx: number;
    if (modoEscala === 'tarjeta') {
      const [a, b] = tarjeta;
      const e = a && b ? escalaTarjeta(a, b) : null;
      if (!e?.ok || !primera) return setError('La tarjeta se ve muy chica en la primera foto. Escribí una medida que sepas.');
      metrosPorPx = e.metrosPorPx * (primera.ancho / (fotos[0]?.ancho ?? ANCHO_PROCESO));
    } else {
      const cm = leerNumero(alto);
      const s = fotos[0] ? silueta(fotos[0]) : null;
      if (cm === null || cm <= 0) return setError('Escribí cuánto mide de alto, en centímetros.');
      if (!s) return fallar('fondo');
      metrosPorPx = escalaPorAlto(cm / 100, s);
    }
    setError(null);
    setPaso('armando');
    try {
      const m = await armarModelo(fotos, metrosPorPx, { alAvanzar: setProceso });
      dejarModelo({ ...m, nombre: nombre.trim() || 'Objeto escaneado' });
      descartar();
      router.push(RUTAS.tallerModelo.ruta);
    } catch (e) {
      fallar(e instanceof ErrorEscaneo ? e.motivo : 'tiempo');
    }
  }

  function fallar(m: MotivoEscaneo) {
    descartar();
    setMotivo(m);
    setPaso('error');
  }

  if (paso === 'fotos')
    return (
      <PantallaCamara
        titulo="Escanear en 3D: sacar las fotos"
        onVolver={() => {
          descartar();
          setPaso('antes');
        }}
        tono="oscuro"
        chip={
          <Chip tono="amarillo" icono="camara">
            {avance.texto}
          </Chip>
        }
        fondo={sensoresPrueba ? <sensoresPrueba.Escena tipo="escanear" /> : <VideoCamara video={cam.video} />}
        encima={<AnilloFotos tomadas={fotos.length} total={TOMAS_ESCANEO} />}
        arriba={
          <>
            <strong>{fotos.length === 0 ? 'Primera foto: de frente, con la tarjeta' : 'Girá alrededor del objeto'}</strong>
            <span>Despacio y a la misma distancia, que entre entero. Los puntos amarillos son las fotos que ya sacaste.</span>
          </>
        }
        panel={
          <>
            {sensoresPrueba ? <AvisoCaja tono="prueba">{sensoresPrueba.aviso}</AvisoCaja> : null}
            {cam.estado === 'sin_camara' ? <AvisoCaja tono="error">No pudimos abrir la cámara. Revisá el permiso y volvé a entrar.</AvisoCaja> : null}
            {error ? <AvisoCaja tono="error">{error}</AvisoCaja> : null}
            <p className="visualmente-oculto" aria-live="polite">
              {avance.texto}
            </p>
            <div className="te-disparo">
              <BotonOscuro
                icono="cerrar"
                onClick={() => {
                  descartar();
                  setPaso('antes');
                }}
              >
                Cancelar
              </BotonOscuro>
              <Disparador etiqueta={`Sacar foto ${Math.min(fotos.length + 1, TOMAS_ESCANEO)} de ${TOMAS_ESCANEO}`} onClick={sacarFoto} deshabilitado={avance.listo || (!sensoresPrueba && cam.estado !== 'viva')} />
              <BotonOscuro icono="cubo" deshabilitado={!avance.listo} onClick={irAEscala}>
                Armar 3D
              </BotonOscuro>
            </div>
          </>
        }
      />
    );

  if (paso === 'escala' && primera)
    return (
      <PantallaSecundaria
        barra={<BarraCompacta titulo="Escanear en 3D" subtitulo="Paso 2 de 3 · La medida de referencia" onVolver={() => setPaso('fotos')} />}
        accion={
          <AccionFija nota="Se arma en tu teléfono: no mandamos las fotos a ningún lado.">
            <Boton icono="cubo" onClick={() => void armar()}>
              Armar el modelo
            </Boton>
          </AccionFija>
        }
      >
        <Segmento<'tarjeta' | 'medida'>
          etiqueta="Cómo damos la escala"
          opciones={[
            { valor: 'tarjeta' as const, texto: 'Con la tarjeta' },
            { valor: 'medida' as const, texto: 'Con una medida' },
          ]}
          valor={modoEscala}
          onCambio={setModoEscala}
        />
        {modoEscala === 'tarjeta' ? (
          <>
            <p className="tm-guia">Poné los dos puntos amarillos en las puntas del lado largo de la tarjeta, en la primera foto.</p>
            <MarcarPuntos imagen={primera.url} alt={primera.propia ? 'La primera foto, con la tarjeta' : 'Foto de prueba: termotanque con una tarjeta apoyada'} ancho={primera.ancho} alto={primera.alto} puntos={tarjeta} onCambio={setTarjeta} elegido={elegido} onElegir={setElegido} nombres={['punta izquierda de la tarjeta', 'punta derecha de la tarjeta']} tramos={['']} tono="tarjeta" />
          </>
        ) : (
          <Campo etiqueta="¿Cuánto mide de alto? (cm)" inputMode="decimal" value={alto} onChange={(e) => setAlto(e.target.value)} ayuda="Si no tenías tarjeta: una medida que sepas, por ejemplo de la etiqueta del equipo." />
        )}
        {error ? <AvisoCaja tono="error">{error}</AvisoCaja> : null}
      </PantallaSecundaria>
    );

  if (paso === 'armando')
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="Escanear en 3D" subtitulo="Paso 3 de 3 · Armando el modelo" />}>
        <section className="te-armando" aria-labelledby="te-armando">
          <h2 id="te-armando">Armando el modelo en tu teléfono</h2>
          <BarraProgreso hechas={Math.round(proceso.fraccion * 100)} total={100} etiqueta="Avance del modelo" fondo="gris" />
          <p aria-live="polite">{proceso.texto}</p>
          <p className="th-pie">No mandamos las fotos a ningún lado. Puede tardar unos segundos.</p>
        </section>
      </PantallaSecundaria>
    );

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Escanear en 3D" subtitulo="Para todos los oficios" hrefVolver={RUTAS.tallerHerramientas.ruta} />}
      accion={
        <AccionFija nota="Las medidas del modelo son aproximadas.">
          {paso === 'error' ? (
            <Boton icono="reintentar" onClick={() => setPaso('antes')}>
              Probar de nuevo
            </Boton>
          ) : (
            <Boton icono="camara" disabled={limite !== null} onClick={() => setPaso('fotos')}>
              Empezar a sacar fotos
            </Boton>
          )}
        </AccionFija>
      }
    >
      {paso === 'error' && motivo ? (
        <AvisoCaja tono="error" titulo={TEXTO_MOTIVO[motivo].titulo}>
          {TEXTO_MOTIVO[motivo].texto}
        </AvisoCaja>
      ) : null}
      {limite ? (
        <AvisoCaja tono="error" titulo={TEXTO_MOTIVO[limite].titulo}>
          {TEXTO_MOTIVO[limite].texto.replace(' No mandamos nada: las fotos se borraron.', ' No mandamos nada a ningún lado.')}
        </AvisoCaja>
      ) : null}
      <ol className="te-pasos">
        <li>
          <strong>Apoyá una tarjeta</strong> SUBE o de crédito contra el frente del objeto: da la escala.
        </li>
        <li>
          <strong>Sacá 30 fotos</strong> dando una vuelta alrededor, despacio y a la misma distancia. La primera, de frente.
        </li>
        <li>
          <strong>El modelo se arma en tu teléfono</strong>, con sus medidas. No mandamos las fotos a ningún lado.
        </li>
      </ol>
      <Campo etiqueta="¿Qué vas a escanear? (si querés)" placeholder="Ej.: Termotanque" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} autoComplete="off" />
      <p className="th-pie">Funciona mejor con una pared lisa detrás y buena luz. Para cortar o comprar, confirmá las medidas con la cinta.</p>
    </PantallaSecundaria>
  );
}
