'use client';
// T-Medir (lote 2.4): medir con la cámara. Con realidad aumentada (WebXR en Android) se marcan puntos en el lugar; en
// iPhone (o sin AR) se saca una foto con una tarjeta SUBE o de crédito apoyada en la misma superficie: sus puntas dan
// la escala. Paso a paso, con todo gesto con botón. La medida es aproximada y se dice siempre: para cortar, la cinta.
// Nada se guarda ni se manda: la foto vive en la memoria de la pantalla. Con datos de prueba, cámara simulada.
import { sensoresPrueba } from '@handyx/origen-datos';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { abrirMedicionAr, type SesionMedicion } from '../../herramientas/medirAr.ts';
import { anguloEntre, escalaTarjeta, MAX_PUNTOS, resumirMedidas, textoMedida, textoParaCompartir, tramosEnAr, tramosEnFoto, type Punto2 } from '../../herramientas/medir.ts';
import { useCamara } from '../../herramientas/useCamara.ts';
import { arInmersivoDisponible } from '../../tres/ar.ts';
import type { Vec3 } from '../../tres/cotas.ts';
import { Boton, BotonIcono } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { TelefonoMide } from '../../ui/ilustraciones/Herramientas.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { MarcarPuntos } from '../../ui/moleculas/MarcarPuntos.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Disparador, PantallaCamara, VideoCamara } from '../../ui/organismos/Camara.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './herramientas.css';

type Paso = 'inicio' | 'foto' | 'tarjeta' | 'puntos' | 'ar';
interface Foto {
  url: string;
  ancho: number;
  alto: number;
  propia: boolean;
}

const AVISO = 'Es una medida aproximada: para cortar, confirmala con la cinta.';
const NOMBRES_TARJETA = ['punta izquierda de la tarjeta', 'punta derecha de la tarjeta'];

export function Medir() {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [hayAr, setHayAr] = useState(false);
  const [foto, setFoto] = useState<Foto | null>(null);
  const [tarjeta, setTarjeta] = useState<Punto2[]>([]);
  const [puntos, setPuntos] = useState<Punto2[]>([]);
  const [elegido, setElegido] = useState(0);
  const [escala, setEscala] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [puntosAr, setPuntosAr] = useState<Vec3[]>([]);
  const archivo = useRef<HTMLInputElement>(null);
  const cam = useCamara({ activa: paso === 'foto', simulada: sensoresPrueba !== null });

  useEffect(() => {
    let vivo = true;
    void arInmersivoDisponible().then((s) => vivo && setHayAr(s));
    return () => {
      vivo = false;
    };
  }, []);
  useEffect(() => () => {
    if (foto?.propia) URL.revokeObjectURL(foto.url);
  }, [foto]);

  function usarFoto(f: Foto) {
    setFoto(f);
    const cx = f.ancho / 2;
    const cy = f.alto * 0.8;
    const prueba = sensoresPrueba && !f.propia ? sensoresPrueba.fotoMedir() : null;
    setTarjeta(prueba ? [...prueba.tarjeta] : [[cx - f.ancho * 0.08, cy], [cx + f.ancho * 0.08, cy]]);
    setPuntos([]);
    setElegido(0);
    setPaso('tarjeta');
  }

  function sacarFoto() {
    if (sensoresPrueba) {
      const p = sensoresPrueba.fotoMedir();
      return usarFoto({ url: p.url, ancho: p.ancho, alto: p.alto, propia: false });
    }
    const c = cam.capturar(1600);
    if (!c) return setError('No pudimos sacar la foto. Probá de nuevo o elegí una de tu teléfono.');
    c.toBlob((b) => b && usarFoto({ url: URL.createObjectURL(b), ancho: c.width, alto: c.height, propia: true }), 'image/jpeg', 0.9);
  }

  async function elegirArchivo(f: File | undefined) {
    if (!f) return;
    const img = await createImageBitmap(f).catch(() => null);
    if (archivo.current) archivo.current.value = '';
    if (!img) return setError('No pudimos abrir esa imagen.');
    usarFoto({ url: URL.createObjectURL(f), ancho: img.width, alto: img.height, propia: true });
    img.close();
  }

  function confirmarTarjeta() {
    const [a, b] = tarjeta;
    if (!a || !b) return;
    const e = escalaTarjeta(a, b);
    if (!e.ok) return setError('La tarjeta se ve muy chica en la foto: sacala más cerca.');
    setError(null);
    setEscala(e.metrosPorPx);
    setElegido(0);
    setPaso('puntos');
  }

  function marcarPunto() {
    if (!foto || puntos.length >= MAX_PUNTOS) return;
    // En la vista previa, los puntos caen donde la persona los pondría (las esquinas del hueco de prueba).
    const sugerido = sensoresPrueba && !foto.propia ? sensoresPrueba.fotoMedir().puntos[puntos.length] : undefined;
    const ultimo = puntos.at(-1);
    const nuevo: Punto2 = sugerido ?? (ultimo ? [Math.min(foto.ancho, ultimo[0] + foto.ancho * 0.15), ultimo[1]] : [foto.ancho * 0.35, foto.alto * 0.4]);
    setPuntos([...puntos, nuevo]);
    setElegido(puntos.length);
  }

  // Medidas: de la foto (con la escala de la tarjeta) o de la AR.
  const tramos = paso === 'ar' || (puntosAr.length > 1 && !foto) ? tramosEnAr(puntosAr) : escala ? tramosEnFoto(puntos, escala) : [];
  const [p0, p1, p2] = paso === 'ar' || (puntosAr.length > 1 && !foto) ? puntosAr : puntos;
  const angulo = p0 && p1 && p2 ? anguloEntre(p0, p1, p2) : null;
  const resumen = resumirMedidas(tramos, angulo);

  async function compartir() {
    const texto = textoParaCompartir(nombre, tramos, resumen);
    try {
      if (navigator.share) await navigator.share({ title: nombre || 'Medidas', text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        setAviso('Copiamos las medidas. Pegalas en el chat o en tu presupuesto.');
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  if (paso === 'foto')
    return (
      <PantallaCamara
        titulo="Medir con la cámara: sacar la foto"
        onVolver={() => setPaso('inicio')}
        chip={
          <Chip tono="blanco" icono="regla">
            Paso 1 de 3
          </Chip>
        }
        fondo={sensoresPrueba ? <sensoresPrueba.Escena tipo="medir" /> : <VideoCamara video={cam.video} />}
        arriba={
          <>
            <strong>Sacá la foto de frente</strong>
            <span>Con la tarjeta apoyada en la misma pared, al lado de lo que vas a medir.</span>
          </>
        }
        panel={
          <div>
            {sensoresPrueba ? <AvisoCaja tono="prueba">{sensoresPrueba.aviso}</AvisoCaja> : null}
            {cam.estado === 'sin_camara' ? <AvisoCaja tono="error">No pudimos abrir la cámara. Elegí una foto de tu teléfono.</AvisoCaja> : null}
            {error ? <AvisoCaja tono="error">{error}</AvisoCaja> : null}
            <div className="tm-disparo">
              <Disparador etiqueta="Sacar la foto" onClick={sacarFoto} deshabilitado={!sensoresPrueba && cam.estado !== 'viva'} />
            </div>
            <Boton variante="contorno" icono="clip" onClick={() => archivo.current?.click()}>
              Elegir una foto
            </Boton>
            <input ref={archivo} type="file" accept="image/*" className="visualmente-oculto" tabIndex={-1} aria-hidden="true" onChange={(e) => void elegirArchivo(e.target.files?.[0])} />
          </div>
        }
      />
    );

  if ((paso === 'tarjeta' || paso === 'puntos') && foto) {
    const enTarjeta = paso === 'tarjeta';
    return (
      <PantallaSecundaria
        barra={<BarraCompacta titulo="Medir con la cámara" subtitulo={enTarjeta ? 'Paso 2 de 3 · La tarjeta' : 'Paso 3 de 3 · Lo que medís'} onVolver={() => setPaso(enTarjeta ? 'foto' : 'tarjeta')} />}
        accion={
          enTarjeta ? (
            <AccionFija>
              <Boton onClick={confirmarTarjeta}>Listo, la tarjeta está marcada</Boton>
            </AccionFija>
          ) : (
            <AccionFija>
              <div className="tm-acciones">
                <BotonIcono icono="deshacer" etiqueta="Deshacer el último punto" disabled={puntos.length === 0} onClick={() => setPuntos(puntos.slice(0, -1))} />
                <Boton icono="mas" disabled={puntos.length >= MAX_PUNTOS} onClick={marcarPunto}>
                  Marcar punto
                </Boton>
              </div>
            </AccionFija>
          )
        }
      >
        <p className="tm-guia">{enTarjeta ? 'Poné los dos puntos amarillos en las puntas del lado largo de la tarjeta. Arrastralos o usá las flechas.' : 'Marcá las puntas de lo que querés medir. Cada punto mide desde el anterior.'}</p>
        <MarcarPuntos
          imagen={foto.url}
          alt={foto.propia ? 'Tu foto para medir' : 'Foto de prueba: el hueco de una ventana con una tarjeta apoyada'}
          ancho={foto.ancho}
          alto={foto.alto}
          puntos={enTarjeta ? tarjeta : puntos}
          onCambio={enTarjeta ? setTarjeta : setPuntos}
          elegido={elegido}
          onElegir={setElegido}
          nombres={enTarjeta ? NOMBRES_TARJETA : puntos.map((_, i) => (i === 0 ? 'el inicio' : `fin de la medida ${i}`))}
          tramos={enTarjeta ? [''] : tramos.map(textoMedida)}
          tono={enTarjeta ? 'tarjeta' : 'medida'}
        />
        {error ? <AvisoCaja tono="error">{error}</AvisoCaja> : null}
        {!enTarjeta ? <ResumenMedidas nombre={nombre} onNombre={setNombre} tramos={tramos} resumen={resumen} onCompartir={() => void compartir()} aviso={aviso} /> : null}
      </PantallaSecundaria>
    );
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Medir con la cámara" subtitulo="Para todos los oficios" hrefVolver={RUTAS.tallerHerramientas.ruta} />}
      accion={
        <AccionFija nota={AVISO}>
          {hayAr ? (
            <MedirConAr onPuntos={setPuntosAr} onTerminar={() => setPaso('inicio')} onEmpezar={() => setPaso('ar')} />
          ) : (
            <Boton icono="camara" onClick={() => setPaso('foto')}>
              Empezar: sacar la foto
            </Boton>
          )}
          {hayAr ? (
            <Boton variante="contorno" icono="camara" onClick={() => setPaso('foto')}>
              Medir con una tarjeta
            </Boton>
          ) : null}
        </AccionFija>
      }
    >
      <div className="tm-portada">
        <TelefonoMide armar tam="medio" />
      </div>
      {hayAr ? (
        <AvisoCaja tono="info" titulo="Tu teléfono mide con realidad aumentada">
          Apuntá a la pared o al piso, esperá el círculo amarillo y marcá las puntas. Precisión de ± 1 cm, aproximada.
        </AvisoCaja>
      ) : (
        <AvisoCaja tono="info" titulo="Medís con una tarjeta de referencia">
          Tu teléfono no tiene realidad aumentada. Apoyá una tarjeta SUBE o una de crédito en la misma pared y sacá la foto de frente: la tarjeta da la escala.
        </AvisoCaja>
      )}
      {puntosAr.length > 1 && !foto ? <ResumenMedidas nombre={nombre} onNombre={setNombre} tramos={tramos} resumen={resumen} onCompartir={() => void compartir()} aviso={aviso} /> : null}
    </PantallaSecundaria>
  );
}

function ResumenMedidas({ nombre, onNombre, tramos, resumen, onCompartir, aviso }: { nombre: string; onNombre(v: string): void; tramos: readonly number[]; resumen: ReturnType<typeof resumirMedidas>; onCompartir(): void; aviso: string | null }) {
  return (
    <section className="tm-resumen" aria-labelledby="tm-resumen">
      <div className="tm-resumen__cabeza">
        <h2 id="tm-resumen">{resumen.texto}</h2>
        <Chip tono={tramos.length ? 'exito' : 'gris'} icono="check">
          {resumen.cantidad}
        </Chip>
      </div>
      {tramos.length ? (
        <ol className="tm-resumen__lista">
          {tramos.map((t, i) => (
            <li key={i}>
              Medida {i + 1}: <strong>{textoMedida(t)}</strong>
            </li>
          ))}
        </ol>
      ) : null}
      <Campo etiqueta="¿Qué mediste? (si querés)" placeholder="Ej.: Hueco de la ventana" value={nombre} onChange={(e) => onNombre(e.target.value)} maxLength={60} autoComplete="off" />
      <Boton variante="contorno" icono="enviar" disabled={tramos.length === 0} onClick={onCompartir}>
        Compartir las medidas
      </Boton>
      {aviso ? <AvisoCaja tono="exito">{aviso}</AvisoCaja> : null}
      <p className="th-pie">{AVISO} En teléfonos sin realidad aumentada, se mide con una tarjeta de referencia.</p>
    </section>
  );
}

/** El botón que abre la AR de Android y su capa encima de la cámara (dom-overlay) con las medidas y los botones. */
function MedirConAr({ onPuntos, onEmpezar, onTerminar }: { onPuntos(p: Vec3[]): void; onEmpezar(): void; onTerminar(): void }) {
  const capa = useRef<HTMLDivElement>(null);
  const sesion = useRef<SesionMedicion | null>(null);
  const [activa, setActiva] = useState(false);
  const [apunta, setApunta] = useState(false);
  const [puntos, setPuntos] = useState<Vec3[]>([]);
  const [fallo, setFallo] = useState(false);
  useEffect(() => () => sesion.current?.terminar(), []);
  const tramos = tramosEnAr(puntos);

  async function abrir() {
    if (!capa.current) return;
    setFallo(false);
    setActiva(true);
    onEmpezar();
    try {
      sesion.current = await abrirMedicionAr({
        capa: capa.current,
        alCambiar: (p) => {
          setPuntos(p);
          onPuntos(p);
        },
        alApuntar: setApunta,
        alSalir: () => {
          setActiva(false);
          onTerminar();
        },
      });
    } catch {
      setActiva(false);
      setFallo(true);
      onTerminar();
    }
  }

  return (
    <>
      <Boton icono="regla" onClick={() => void abrir()}>
        Medir con realidad aumentada
      </Boton>
      {fallo ? <AvisoCaja tono="error">No pudimos abrir la cámara en AR. Revisá el permiso o medí con una tarjeta.</AvisoCaja> : null}
      <div ref={capa} className={`tm-capa${activa ? ' tm-capa--activa' : ''}`} hidden={!activa}>
        <div className="tm-capa__arriba">
          <Chip tono="blanco" icono="regla">
            Precisión ± 1 cm
          </Chip>
        </div>
        <div className="tm-capa__panel">
          <p aria-live="polite">{apunta ? (tramos.length ? `${tramos.map(textoMedida).join(' · ')}` : 'Tocá «Marcar punto» en la primera punta.') : 'Mové el teléfono despacio hasta ver el círculo amarillo.'}</p>
          <div className="tm-acciones">
            <BotonIcono icono="deshacer" etiqueta="Deshacer el último punto" disabled={puntos.length === 0} onClick={() => sesion.current?.deshacer()} />
            <Boton icono="mas" disabled={!apunta} onClick={() => sesion.current?.marcar()}>
              Marcar punto
            </Boton>
            <BotonIcono icono="check" etiqueta="Listo: salir de la cámara" onClick={() => sesion.current?.terminar()} />
          </div>
          <p className="th-pie">{AVISO}</p>
        </div>
      </div>
    </>
  );
}
