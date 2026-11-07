'use client';
// Vista 3D del tablero (fase H1) con Three.js. Dibuja lo que calcula `armarTablero`: gabinete, rieles DIN y cada
// dispositivo en su módulo. GSAP hace caer cada dispositivo nuevo sobre el riel. Se renderiza solo cuando algo cambia
// (sin bucle continuo, para cuidar la batería). Es decorativa para los lectores de pantalla: la lista de la pantalla es
// la descripción accesible.
import { gsap } from 'gsap';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { sinMovimiento } from '../../kit/movimiento.ts';
import { armarTablero, DISPOSITIVO, type Dispositivo } from '../../taller/tablero.ts';

const MODULO = 0.18; // 18 mm por módulo, en decímetros de escena
const ALTO_DISP = 0.9;
const FONDO_DISP = 0.6;
const ALTO_FILA = 1.25;

export interface ManejoTablero {
  /** Imagen PNG de la vista actual (para compartir). */
  imagen(): Promise<Blob | null>;
  /** Modelo USDZ para AR Quick Look en iPhone. */
  usdz(): Promise<Blob>;
  /** Copia del tablero armado (para la AR), en decímetros. */
  objeto(): THREE.Object3D | null;
}

function etiquetaTextura(texto: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return new THREE.CanvasTexture(c);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#0e1d36';
  g.font = '700 30px "DM Sans", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(texto, 64, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const Tablero3D = forwardRef<ManejoTablero, { dispositivos: readonly Dispositivo[] }>(function Tablero3D({ dispositivos }, ref) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render(): void } | null>(null);
  const vistos = useRef(new Set<string>());

  // Escena, cámara, luces y controles: una sola vez.
  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      return; // Sin WebGL: queda la lista de la pantalla.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0.9, 0.6, 5.2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc8d0de, 2.2));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6);
    sol.position.set(3, 4, 5);
    scene.add(sol);
    const grupo = new THREE.Group();
    scene.add(grupo);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 2.5;
    controls.maxDistance = 9;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = (Math.PI * 3) / 4;
    controls.minAzimuthAngle = -Math.PI / 3;
    controls.maxAzimuthAngle = Math.PI / 3;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    const ajustar = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const obs = new ResizeObserver(ajustar);
    obs.observe(canvas);
    motor.current = { renderer, scene, camera, controls, grupo, render };
    ajustar();
    return () => {
      obs.disconnect();
      controls.dispose();
      renderer.dispose();
      motor.current = null;
    };
  }, []);

  // El tablero: se rearma cada vez que cambian los dispositivos.
  useEffect(() => {
    const m = motor.current;
    if (!m) return;
    const { grupo, render } = m;
    grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((mt: THREE.Material & { map?: THREE.Texture | null }) => {
          mt.map?.dispose();
          mt.dispose();
        });
      }
    });
    grupo.clear();
    const a = armarTablero(dispositivos);
    const ancho = a.porFila * MODULO + 0.5;
    const alto = Math.max(1, a.filas) * ALTO_FILA + 0.4;
    // Gabinete: fondo y marco.
    const fondo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 0.08), new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.8 }));
    fondo.position.z = -FONDO_DISP / 2 - 0.1;
    grupo.add(fondo);
    const marco = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.12, alto + 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0xdadfe8, roughness: 0.6 }));
    marco.position.z = -FONDO_DISP / 2 - 0.16;
    grupo.add(marco);
    const arriba = alto / 2 - 0.2 - ALTO_FILA / 2;
    for (let f = 0; f < Math.max(1, a.filas); f++) {
      const riel = new THREE.Mesh(new THREE.BoxGeometry(a.porFila * MODULO + 0.2, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: 0xaab2bf, metalness: 0.7, roughness: 0.35 }));
      riel.position.set(0, arriba - f * ALTO_FILA, -FONDO_DISP / 2 - 0.03);
      grupo.add(riel);
    }
    const izquierda = (-a.porFila * MODULO) / 2;
    const nuevos: THREE.Object3D[] = [];
    dispositivos.forEach((d) => {
      const p = a.posiciones.find((x) => x.id === d.id);
      if (!p) return;
      const tipo = DISPOSITIVO[d.tipo];
      const pieza = new THREE.Group();
      const w = p.modulos * MODULO - 0.012;
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(w, ALTO_DISP, FONDO_DISP), new THREE.MeshStandardMaterial({ color: new THREE.Color(tipo.color), roughness: 0.55 }));
      pieza.add(cuerpo);
      const palanca = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w * 0.7, 0.24), 0.16, 0.12), new THREE.MeshStandardMaterial({ color: d.tipo.startsWith('diferencial') ? 0x1f57a8 : 0x26324a, roughness: 0.4 }));
      palanca.position.set(0, 0.08, FONDO_DISP / 2 + 0.05);
      pieza.add(palanca);
      if (d.calibre) {
        const et = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 0.34), 0.17), new THREE.MeshBasicMaterial({ map: etiquetaTextura(`${d.calibre}A`) }));
        et.position.set(0, -0.24, FONDO_DISP / 2 + 0.002);
        pieza.add(et);
      }
      pieza.position.set(izquierda + (p.inicio + p.modulos / 2) * MODULO, arriba - p.fila * ALTO_FILA, 0);
      grupo.add(pieza);
      if (!vistos.current.has(d.id)) nuevos.push(pieza);
    });
    vistos.current = new Set(dispositivos.map((d) => d.id));
    m.camera.position.setLength(Math.max(3.1, ancho * 1.25, alto * 1.9));
    render();
    if (!sinMovimiento() && nuevos.length && nuevos.length < dispositivos.length + 1) {
      nuevos.forEach((pieza, i) => {
        const y = pieza.position.y;
        pieza.position.y = y + 1.4;
        gsap.to(pieza.position, { y, duration: 0.6, delay: i * 0.06, ease: 'bounce.out', onUpdate: render });
      });
    }
  }, [dispositivos]);

  useImperativeHandle(ref, () => ({
    objeto: () => motor.current?.grupo.clone(true) ?? null,
    imagen: () =>
      new Promise((ok) => {
        const m = motor.current;
        if (!m) return ok(null);
        m.render();
        m.renderer.domElement.toBlob((b) => ok(b), 'image/png');
      }),
    usdz: async () => {
      const m = motor.current;
      if (!m) throw new Error('sin escena');
      const exportador = new USDZExporter();
      const datos = await exportador.parseAsync(m.grupo);
      return new Blob([datos as BlobPart], { type: 'model/vnd.usdz+zip' });
    },
  }));

  return <canvas ref={lienzo} className="tl-3d" aria-hidden="true" />;
});
