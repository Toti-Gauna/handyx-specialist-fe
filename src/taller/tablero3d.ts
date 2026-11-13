// Tablero eléctrico en 3D para el visor común (lote 2.4: T-Tablero pasa a src/tres; antes tenía su propio renderer con
// OrbitControls y sin botones). Dibuja lo que calcula `armarTablero`: gabinete, rieles DIN y cada dispositivo en su
// módulo, con la etiqueta del calibre. Los dispositivos nuevos caen sobre el riel (sin «reducir movimiento»).
// Unidades: decímetros de escena (la AR usa escala 0,1 para pasar a metros).
import * as THREE from 'three';
import type { MontarEscena } from '../tres/motor.ts';
import { armarTablero, DISPOSITIVO, type Dispositivo } from './tablero.ts';

const MODULO = 0.18; // 18 mm por módulo
const ALTO_DISP = 0.9;
const FONDO_DISP = 0.6;
const ALTO_FILA = 1.25;
const CAIDA = 1.4;
const CAIDA_MS = 600;

function etiquetaTextura(texto: string): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
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

/** El tablero armado (para el visor y para la AR). `nuevos`: ids que acaban de agregarse (caen). */
export function crearTablero(dispositivos: readonly Dispositivo[]): { grupo: THREE.Group; piezas: Map<string, THREE.Object3D>; ancho: number; alto: number } {
  const grupo = new THREE.Group();
  grupo.name = 'tablero';
  const a = armarTablero(dispositivos);
  const ancho = a.porFila * MODULO + 0.5;
  const alto = Math.max(1, a.filas) * ALTO_FILA + 0.4;
  const fondo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 0.08), new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.8 }));
  fondo.position.z = -FONDO_DISP / 2 - 0.1;
  grupo.add(fondo);
  const marco = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.12, alto + 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0xdadfe8, roughness: 0.6 }));
  marco.position.z = -FONDO_DISP / 2 - 0.16;
  grupo.add(marco);
  const arriba = alto / 2 - 0.2 - ALTO_FILA / 2;
  const metal = new THREE.MeshStandardMaterial({ color: 0xaab2bf, metalness: 0.7, roughness: 0.35 });
  for (let f = 0; f < Math.max(1, a.filas); f++) {
    const riel = new THREE.Mesh(new THREE.BoxGeometry(a.porFila * MODULO + 0.2, 0.18, 0.06), metal);
    riel.position.set(0, arriba - f * ALTO_FILA, -FONDO_DISP / 2 - 0.03);
    grupo.add(riel);
  }
  const izquierda = (-a.porFila * MODULO) / 2;
  const piezas = new Map<string, THREE.Object3D>();
  for (const d of dispositivos) {
    const p = a.posiciones.find((x) => x.id === d.id);
    if (!p) continue;
    const pieza = new THREE.Group();
    const w = p.modulos * MODULO - 0.012;
    pieza.add(new THREE.Mesh(new THREE.BoxGeometry(w, ALTO_DISP, FONDO_DISP), new THREE.MeshStandardMaterial({ color: new THREE.Color(DISPOSITIVO[d.tipo].color), roughness: 0.55 })));
    const palanca = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w * 0.7, 0.24), 0.16, 0.12), new THREE.MeshStandardMaterial({ color: d.tipo.startsWith('diferencial') ? 0x1f57a8 : 0x26324a, roughness: 0.4 }));
    palanca.position.set(0, 0.08, FONDO_DISP / 2 + 0.05);
    pieza.add(palanca);
    const textura = d.calibre ? etiquetaTextura(`${d.calibre}A`) : null;
    if (textura) {
      const et = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 0.34), 0.17), new THREE.MeshBasicMaterial({ map: textura }));
      et.position.set(0, -0.24, FONDO_DISP / 2 + 0.002);
      pieza.add(et);
    }
    pieza.position.set(izquierda + (p.inicio + p.modulos / 2) * MODULO, arriba - p.fila * ALTO_FILA, 0);
    grupo.add(pieza);
    piezas.set(d.id, pieza);
  }
  return { grupo, piezas, ancho, alto };
}

/** Escena del visor común: el tablero y la caída de lo nuevo (rebote corto, nunca con «reducir movimiento»). */
export function escenaTablero(dispositivos: readonly Dispositivo[], nuevos: ReadonlySet<string> = new Set()): MontarEscena {
  return (ctx) => {
    const t = crearTablero(dispositivos);
    ctx.raiz.add(t.grupo);
    ctx.encuadrar([0, 0, 0], Math.max(t.ancho, t.alto) * 0.62);
    const caen = [...t.piezas].filter(([id]) => nuevos.has(id)).map(([, o]) => o);
    if (ctx.sinMovimiento || caen.length === 0 || caen.length === dispositivos.length) return;
    const destino = caen.map((o) => o.position.y);
    caen.forEach((o) => (o.position.y += CAIDA));
    let ms = 0;
    return ctx.animar((dt) => {
      ms += dt;
      caen.forEach((o, i) => {
        const x = Math.min(1, Math.max(0, (ms - i * 60) / CAIDA_MS));
        // Rebote: baja rápido y se asienta.
        const r = 1 - Math.pow(1 - x, 3) * Math.abs(Math.cos(x * Math.PI * 1.5));
        o.position.y = (destino[i] ?? 0) + CAIDA * (1 - r);
      });
      return ms < CAIDA_MS + caen.length * 60;
    });
  };
}
