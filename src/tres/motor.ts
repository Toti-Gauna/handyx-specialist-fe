// Motor del visor 3D (lote 0.3): renderer, escena, cámara orbital con gestos y el bucle **bajo demanda**. Solo se dibuja
// cuando algo cambia (un gesto, la cámara que todavía se acomoda, una animación registrada); en reposo no hay bucle.
// Se pausa con la pestaña oculta o el visor fuera de la pantalla, y libera todo al desmontar. Lo usa Visor3D.tsx.
import * as THREE from 'three';
import type { Vec3 } from './cotas.ts';
import { crearSeguimiento, factorRueda } from './gestos.ts';
import { contarTriangulos, esferaDe, liberar } from './limpieza.ts';
import { aplicarEntorno, crearMateriales, ponerLuces, type Materiales } from './marca.ts';
import { aCartesianas, acercar, amortiguar, asentada, giroAutomatico, girar, limitesPara, orbitaInicial, type LimitesOrbita, type Orbita } from './orbita.ts';
import { dentroDelPresupuesto, densidadPara, tocaCuadro, type Presupuesto } from './presupuesto.ts';

/** Lo que recibe la función que arma la escena. */
export interface ContextoVisor {
  escena: THREE.Scene;
  /** Agregá acá lo tuyo: se libera al rearmar y al desmontar. */
  raiz: THREE.Group;
  /** Materiales comunes de la marca (no los liberes: son del visor). */
  materiales: Materiales;
  presupuesto: Presupuesto;
  /** «Reducir movimiento»: sin animaciones automáticas. */
  sinMovimiento: boolean;
  /** Pedí un cuadro después de cambiar algo por tu cuenta (p. ej. desde un tween de GSAP). */
  pedirCuadro(): void;
  /** Animación cuadro a cuadro: `paso` recibe los ms desde el cuadro anterior y devuelve si sigue. Devuelve cómo cortarla. */
  animar(paso: (dtMs: number) => boolean): () => void;
  /** Encuadra la cámara en una esfera (si no lo llamás, se encuadra todo lo que hay en `raiz`). */
  encuadrar(centro: Vec3, radio: number): void;
}

export type MontarEscena = (ctx: ContextoVisor) => void | (() => void);

export type Mover = 'izquierda' | 'derecha' | 'acercar' | 'alejar';

export interface OpcionesMotor {
  presupuesto: Presupuesto;
  sinMovimiento: boolean;
  /** Giro lento cuando nadie toca (vitrina de un premio). Se apaga solo después de `GIRO_MAX_MS`. */
  giro: boolean;
  limites?: Partial<LimitesOrbita>;
  alPerderContexto: () => void;
}

export interface Motor {
  montar(fn: MontarEscena): void;
  centrar(): void;
  mover(m: Mover): void;
  imagen(): Promise<Blob | null>;
  objeto(): THREE.Object3D | null;
  pedirCuadro(): void;
  /** Prende o apaga el giro automático (nunca con «reducir movimiento»). */
  ponerGiro(si: boolean): void;
  liberar(): void;
}

const FOV = 35;
/** El giro automático se detiene a los 20 s sin tocar (batería). */
export const GIRO_MAX_MS = 20_000;
const GIRO_ESPERA_MS = 2_500;

export function crearMotor(contenedor: HTMLElement, o: OpcionesMotor): Motor | null {
  const p = o.presupuesto;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'tr-visor__lienzo';
  lienzo.setAttribute('aria-hidden', 'true');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: p.antialias, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  contenedor.prepend(lienzo);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.01, 200);
  ponerLuces(escena);
  const quitarEntorno = p.entorno ? aplicarEntorno(renderer, escena) : () => undefined;
  const materiales = crearMateriales();
  const comunes = new Set<THREE.Material>(materiales.todos());
  const raiz = new THREE.Group();
  escena.add(raiz);

  let centro: Vec3 = [0, 0, 0];
  let limites: LimitesOrbita = { ...limitesPara(0.5), ...o.limites };
  let inicial: Orbita = orbitaInicial(0.5, FOV, 1, limites);
  let actual: Orbita = { ...inicial };
  let objetivo: Orbita = { ...inicial };
  let radioVista = 0.5;
  const pasos = new Set<(dt: number) => boolean>();
  let desmontar: (() => void) | null = null;
  let encuadreManual = false;
  let cuadro = 0;
  let ultimo = 0;
  let pausado = document.visibilityState === 'hidden';
  let enVista = true;
  let giro = o.giro && !o.sinMovimiento;
  let ultimaInteraccion = performance.now();
  let liberado = false;
  const seguimiento = crearSeguimiento();
  let despertar: ReturnType<typeof setTimeout> | undefined;

  const activo = () => !liberado && !pausado && enVista;

  function pedirCuadro() {
    if (cuadro || !activo()) return;
    cuadro = requestAnimationFrame(dibujar);
  }

  function aplicarCamara() {
    const [x, y, z] = aCartesianas(actual, centro);
    camara.position.set(x, y, z);
    camara.lookAt(centro[0], centro[1], centro[2]);
  }

  function dibujar(t: number) {
    cuadro = 0;
    if (!activo()) return;
    if (ultimo && !tocaCuadro(p, t, ultimo)) {
      cuadro = requestAnimationFrame(dibujar);
      return;
    }
    const dt = ultimo ? Math.min(100, t - ultimo) : 16;
    ultimo = t;
    pasos.forEach((paso) => {
      if (!paso(dt)) pasos.delete(paso);
    });
    const quieto = t - ultimaInteraccion;
    const girando = giro && seguimiento.activos === 0 && quieto > GIRO_ESPERA_MS && quieto < GIRO_MAX_MS;
    if (girando) objetivo = giroAutomatico(objetivo, dt);
    actual = amortiguar(actual, objetivo, dt);
    const llego = asentada(actual, objetivo);
    if (llego) actual = { ...objetivo };
    aplicarCamara();
    renderer.render(escena, camara);
    if (pasos.size > 0 || !llego || girando) {
      cuadro = requestAnimationFrame(dibujar);
      return;
    }
    ultimo = 0;
    // En reposo no hay bucle: si el giro automático está esperando, se lo despierta con un temporizador.
    if (giro && quieto <= GIRO_ESPERA_MS) {
      clearTimeout(despertar);
      despertar = setTimeout(pedirCuadro, GIRO_ESPERA_MS - quieto + 20);
    }
  }

  function encuadrar(c: Vec3, radio: number) {
    centro = c;
    radioVista = radio;
    limites = { ...limitesPara(radio), ...o.limites };
    inicial = orbitaInicial(radio, FOV, camara.aspect, limites);
    actual = { ...inicial };
    objetivo = { ...inicial };
    pedirCuadro();
  }

  // ── Tamaño: densidad con tope y píxeles máximos del presupuesto ──
  const ajustar = () => {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(densidadPara(p, window.devicePixelRatio, w, h));
    renderer.setSize(w, h, false);
    const antes = camara.aspect;
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    // Con otro formato, la vista inicial vuelve a encuadrar (un celular que gira).
    if (Math.abs(antes - camara.aspect) > 0.01) {
      inicial = orbitaInicial(radioVista, FOV, camara.aspect, limites);
      if (asentada(actual, objetivo)) {
        objetivo = { ...objetivo, distancia: inicial.distancia };
        actual = { ...objetivo };
      }
    }
    pedirCuadro();
  };
  const tamano = new ResizeObserver(ajustar);
  tamano.observe(contenedor);
  const vista = new IntersectionObserver((e) => {
    enVista = e.some((x) => x.isIntersecting);
    if (enVista) pedirCuadro();
  });
  vista.observe(contenedor);
  const alCambiarVisibilidad = () => {
    pausado = document.visibilityState === 'hidden';
    if (pausado && cuadro) {
      cancelAnimationFrame(cuadro);
      cuadro = 0;
    }
    ultimo = 0;
    if (!pausado) pedirCuadro();
  };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  // ── Gestos ──
  const punto = (e: PointerEvent) => ({ id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp });
  const tocar = () => {
    ultimaInteraccion = performance.now();
  };
  const alBajar = (e: PointerEvent) => {
    lienzo.setPointerCapture?.(e.pointerId);
    seguimiento.bajar(punto(e));
    tocar();
  };
  const alMover = (e: PointerEvent) => {
    const g = seguimiento.mover(punto(e));
    if (!g) return;
    tocar();
    if (g.tipo === 'girar') objetivo = girar(objetivo, g.dx, g.dy, lienzo.clientHeight, limites);
    else if (g.tipo === 'pellizco') objetivo = acercar(objetivo, g.factor, limites);
    pedirCuadro();
  };
  const alSubir = (e: PointerEvent) => {
    const g = seguimiento.subir(punto(e));
    tocar();
    if (g?.tipo === 'doble-toque') centrar();
  };
  const alRueda = (e: WheelEvent) => {
    e.preventDefault();
    tocar();
    objetivo = acercar(objetivo, factorRueda(e.deltaY), limites);
    pedirCuadro();
  };
  const alPerder = (e: Event) => {
    e.preventDefault();
    if (cuadro) cancelAnimationFrame(cuadro);
    cuadro = 0;
    o.alPerderContexto();
  };
  lienzo.addEventListener('pointerdown', alBajar);
  lienzo.addEventListener('pointermove', alMover);
  lienzo.addEventListener('pointerup', alSubir);
  lienzo.addEventListener('pointercancel', alSubir);
  lienzo.addEventListener('wheel', alRueda, { passive: false });
  lienzo.addEventListener('webglcontextlost', alPerder);

  const ctx: ContextoVisor = {
    escena,
    raiz,
    materiales,
    presupuesto: p,
    sinMovimiento: o.sinMovimiento,
    pedirCuadro,
    animar(paso) {
      pasos.add(paso);
      pedirCuadro();
      return () => void pasos.delete(paso);
    },
    encuadrar(c, radio) {
      encuadreManual = true;
      encuadrar(c, radio);
    },
  };

  function limpiarEscena() {
    desmontar?.();
    desmontar = null;
    pasos.clear();
    liberar(raiz, comunes);
    raiz.clear();
  }

  function centrar() {
    tocar();
    objetivo = { ...inicial };
    pedirCuadro();
  }

  return {
    montar(fn) {
      limpiarEscena();
      encuadreManual = false;
      desmontar = fn(ctx) ?? null;
      if (!encuadreManual) {
        const { centro: c, radio } = esferaDe(raiz);
        encuadrar(c, radio);
      }
      if (process.env.NODE_ENV !== 'production') {
        const tri = contarTriangulos(raiz);
        if (!dentroDelPresupuesto(p, tri)) console.warn(`Visor3D: ${tri} triángulos, más que el presupuesto ${p.nivel} (${p.triangulosMax}).`);
      }
      pedirCuadro();
    },
    centrar,
    mover(m) {
      tocar();
      const paso = Math.PI / 8;
      if (m === 'izquierda') objetivo = girar(objetivo, (paso * Math.max(1, lienzo.clientHeight)) / Math.PI, 0, lienzo.clientHeight, limites);
      else if (m === 'derecha') objetivo = girar(objetivo, (-paso * Math.max(1, lienzo.clientHeight)) / Math.PI, 0, lienzo.clientHeight, limites);
      else objetivo = acercar(objetivo, m === 'acercar' ? 0.8 : 1.25, limites);
      pedirCuadro();
    },
    pedirCuadro,
    ponerGiro(si) {
      giro = si && !o.sinMovimiento;
      ultimaInteraccion = performance.now();
      pedirCuadro();
    },
    objeto: () => (raiz.children.length ? raiz.clone(true) : null),
    imagen: () =>
      new Promise((ok) => {
        if (liberado) return ok(null);
        aplicarCamara();
        renderer.render(escena, camara);
        // toBlob copia el lienzo en este mismo momento: no hace falta preserveDrawingBuffer (que cuesta en gama baja).
        lienzo.toBlob((b) => ok(b), 'image/png');
      }),
    liberar() {
      if (liberado) return;
      liberado = true;
      if (cuadro) cancelAnimationFrame(cuadro);
      clearTimeout(despertar);
      tamano.disconnect();
      vista.disconnect();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('pointerup', alSubir);
      lienzo.removeEventListener('pointercancel', alSubir);
      lienzo.removeEventListener('wheel', alRueda);
      lienzo.removeEventListener('webglcontextlost', alPerder);
      limpiarEscena();
      liberar(escena, comunes);
      materiales.liberar();
      quitarEntorno();
      renderer.dispose();
      // Suelta el contexto ya: los navegadores limitan cuántos hay vivos y el lienzo es nuestro (no se reusa).
      renderer.forceContextLoss();
      lienzo.remove();
    },
  };
}
