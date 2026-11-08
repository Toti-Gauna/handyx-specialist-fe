// Luces, materiales y entorno comunes del 3D de Handyx (lote 0.3). Los colores salen de los tokens de marca. Todo se
// crea por visor y se libera con él (ver limpieza.ts). Funciona también en Node (las pruebas arman las primitivas):
// lo que necesita un documento (etiquetas de texto) devuelve null sin él.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { colores } from '../brand/tokens.ts';

/** Paleta 3D. «noche» es el azul más oscuro de la marca (tinta, #0E1D36). */
export const COLOR_3D = {
  azul: colores.azul,
  amarillo: colores.amarillo,
  noche: colores.tinta,
  superficie: '#F4F5F7',
  superficieHonda: colores.borde,
  mosaico: colores.mosaico,
  blanco: colores.fondo,
  metal: '#AAB2BF',
  naranja: colores.naranja,
} as const;

export interface Materiales {
  azul: THREE.MeshStandardMaterial;
  amarillo: THREE.MeshStandardMaterial;
  noche: THREE.MeshStandardMaterial;
  superficie: THREE.MeshStandardMaterial;
  superficieHonda: THREE.MeshStandardMaterial;
  mosaico: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  /** Brilla sola (luz que sale de la caja, foco de una luminaria). */
  luz: THREE.MeshStandardMaterial;
  /** Líneas de cota y guías. */
  linea: THREE.LineBasicMaterial;
  lineaSuave: THREE.LineBasicMaterial;
  /** Todos, para conservarlos al limpiar una escena y liberarlos al final. */
  todos(): THREE.Material[];
  liberar(): void;
}

export function crearMateriales(): Materiales {
  const std = (color: string, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const m = {
    azul: std(COLOR_3D.azul, 0.45),
    amarillo: std(COLOR_3D.amarillo, 0.5),
    noche: std(COLOR_3D.noche, 0.6),
    superficie: std(COLOR_3D.superficie, 0.7),
    superficieHonda: std(COLOR_3D.superficieHonda, 0.75),
    mosaico: std(COLOR_3D.mosaico, 0.85),
    metal: std(COLOR_3D.metal, 0.35, 0.7),
    luz: new THREE.MeshStandardMaterial({ color: COLOR_3D.blanco, emissive: COLOR_3D.amarillo, emissiveIntensity: 1.2 }),
    linea: new THREE.LineBasicMaterial({ color: COLOR_3D.azul }),
    lineaSuave: new THREE.LineBasicMaterial({ color: COLOR_3D.azul, transparent: true, opacity: 0.45 }),
  };
  const lista: THREE.Material[] = Object.values(m);
  return { ...m, todos: () => lista, liberar: () => lista.forEach((x) => x.dispose()) };
}

/**
 * Luces del visor: cielo y piso (hemisférica), un sol arriba a la derecha y un relleno azul suave desde atrás que
 * separa el objeto del fondo. Sin sombras proyectadas (caras en gama baja): la sombra de contacto las reemplaza.
 */
export function ponerLuces(escena: THREE.Scene): void {
  escena.add(new THREE.HemisphereLight(0xffffff, 0xc8d0de, 2.2));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6);
  sol.position.set(3, 4, 5);
  escena.add(sol);
  const relleno = new THREE.DirectionalLight(0x9db6e0, 0.6);
  relleno.position.set(-3, 2, -4);
  escena.add(relleno);
}

/** Luces de la AR: las mismas de la primera versión del Taller (H1.4), para no cambiar cómo se ve. */
export function ponerLucesAr(escena: THREE.Scene): void {
  escena.add(new THREE.HemisphereLight(0xffffff, 0xc8d0de, 2.6));
  const luz = new THREE.DirectionalLight(0xffffff, 1.4);
  luz.position.set(0.5, 1, 0.8);
  escena.add(luz);
}

/**
 * Entorno suave: un cuarto claro calculado una sola vez como mapa de reflejos (los metales y el plástico dejan de verse
 * planos). Solo si el presupuesto lo permite. Devuelve cómo liberarlo.
 */
export function aplicarEntorno(renderer: THREE.WebGLRenderer, escena: THREE.Scene, intensidad = 0.35): () => void {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const cuarto = new RoomEnvironment();
  const textura = pmrem.fromScene(cuarto, 0.04).texture;
  escena.environment = textura;
  escena.environmentIntensity = intensidad;
  cuarto.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();
  return () => {
    escena.environment = null;
    textura.dispose();
  };
}

/** Textura de sombra suave hecha a mano (sin lienzo): un círculo que se desvanece hacia el borde. */
function texturaSombra(lado = 64): THREE.DataTexture {
  const datos = new Uint8Array(lado * lado * 4);
  const c = (lado - 1) / 2;
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const d = Math.min(1, Math.hypot(x - c, y - c) / c);
      const i = (y * lado + x) * 4;
      datos[i] = 14;
      datos[i + 1] = 29;
      datos[i + 2] = 54;
      datos[i + 3] = Math.round(255 * (1 - d) ** 2);
    }
  }
  const t = new THREE.DataTexture(datos, lado, lado, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}

/** Sombra de contacto bajo el objeto (en el piso, y = 0). Mucho más barata que las sombras en tiempo real. */
export function crearSombraContacto(radio: number, opacidad = 0.28): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, opacity: opacidad, depthWrite: false });
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(radio * 2, radio * 2).rotateX(-Math.PI / 2), material);
  sombra.position.y = 0.001;
  sombra.renderOrder = -1;
  sombra.name = 'sombra';
  return sombra;
}

/**
 * Etiqueta de texto que siempre mira a la cámara (cotas, números de estación). Pastilla blanca con texto tinta, se lee
 * encima del objeto. `alto` en unidades de la escena. Sin documento (Node), devuelve null.
 */
export function crearEtiqueta(texto: string, alto = 0.07, o: { fondo?: string; color?: string } = {}): THREE.Sprite | null {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  const g = lienzo.getContext('2d');
  if (!g) return null;
  const px = 64;
  const fuente = `700 ${px * 0.62}px "DM Sans Variable", "DM Sans", system-ui, sans-serif`;
  g.font = fuente;
  const ancho = Math.ceil(g.measureText(texto).width + px * 0.7);
  lienzo.width = ancho;
  lienzo.height = px;
  g.font = fuente;
  g.fillStyle = o.fondo ?? COLOR_3D.blanco;
  g.beginPath();
  g.roundRect(0, 0, ancho, px, px / 2);
  g.fill();
  g.fillStyle = o.color ?? COLOR_3D.noche;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(texto, ancho / 2, px * 0.54);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, depthTest: false, transparent: true }));
  sprite.scale.set((alto * ancho) / px, alto, 1);
  sprite.renderOrder = 10;
  return sprite;
}
