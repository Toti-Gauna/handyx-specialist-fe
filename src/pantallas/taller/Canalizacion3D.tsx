'use client';
// Vista 3D del recorrido de caños (fase H1.5), nativa con Three.js. Ambiente con piso y paredes, tablero, bocas y un caño
// por circuito que se dibuja de punta a punta con GSAP. Se renderiza solo cuando algo cambia. Decorativa para lectores
// de pantalla: la lista de la pantalla describe lo mismo.
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sinMovimiento } from '../../kit/movimiento.ts';
import type { Canalizacion } from '../../taller/canalizacion.ts';

export const COLOR_CIRCUITO = { iug: 0x1f57a8, tug: 0xf6a623 } as const;

export function Canalizacion3D({ c, largo, ancho, alto }: { c: Canalizacion; largo: number; ancho: number; alto: number }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render(): void } | null>(null);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc8d0de, 2.2));
    const sol = new THREE.DirectionalLight(0xffffff, 1.2);
    sol.position.set(4, 6, 5);
    scene.add(sol);
    const grupo = new THREE.Group();
    scene.add(grupo);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2.05;
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

  useEffect(() => {
    const m = motor.current;
    if (!m) return;
    const { grupo, render, camera, controls } = m;
    grupo.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((x: THREE.Material) => x.dispose());
      }
    });
    grupo.clear();
    // Centrado en el origen.
    grupo.position.set(-largo / 2, 0, -ancho / 2);
    const piso = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.04, ancho), new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.9 }));
    piso.position.set(largo / 2, -0.02, ancho / 2);
    grupo.add(piso);
    const pared = (w: number, d: number, x: number, z: number, color: number, opacidad = 1) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, alto, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85, transparent: opacidad < 1, opacity: opacidad }));
      p.position.set(x, alto / 2, z);
      grupo.add(p);
    };
    pared(largo, 0.06, largo / 2, -0.03, 0xf4f5f7); // pared del tablero
    pared(0.06, ancho, -0.03, ancho / 2, 0xeef0f3);
    pared(0.06, ancho, largo + 0.03, ancho / 2, 0xeef0f3, 0.25);
    const tablero = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0xdadfe8 }));
    tablero.position.set(c.tablero.x, c.tablero.y, 0.05);
    grupo.add(tablero);
    for (const b of c.bocas) {
      const geo = b.tipo === 'luz' ? new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24) : new THREE.BoxGeometry(0.1, 0.14, 0.04);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: b.tipo === 'luz' ? 0xf5f59a : 0xffffff, emissive: b.tipo === 'luz' ? 0x6b6a20 : 0x000000 }));
      mesh.position.set(b.punto.x, b.tipo === 'luz' ? b.punto.y - 0.02 : b.punto.y, b.punto.z);
      if (b.tipo !== 'luz' && (b.punto.x === 0 || b.punto.x >= largo)) mesh.rotation.y = Math.PI / 2;
      grupo.add(mesh);
    }
    const tubos: THREE.BufferGeometry[] = [];
    for (const circ of c.circuitos) {
      const camino = new THREE.CurvePath<THREE.Vector3>();
      for (let i = 1; i < circ.recorrido.length; i++) {
        const a = circ.recorrido[i - 1];
        const b = circ.recorrido[i];
        if (a && b) camino.add(new THREE.LineCurve3(new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)));
      }
      const geo = new THREE.TubeGeometry(camino, Math.max(64, circ.recorrido.length * 24), 0.025, 8, false);
      grupo.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: COLOR_CIRCUITO[circ.id], roughness: 0.5 })));
      tubos.push(geo);
    }
    const d = Math.max(largo, ancho, alto);
    camera.position.set(d * 0.9, d * 1.1, d * 1.6);
    controls.target.set(0, alto / 3, 0);
    controls.update();
    if (sinMovimiento()) {
      render();
      return;
    }
    // El caño se dibuja de punta a punta.
    const avance = { t: 0 };
    tubos.forEach((g) => g.setDrawRange(0, 0));
    const anim = gsap.to(avance, {
      t: 1,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => {
        tubos.forEach((g) => g.setDrawRange(0, Math.floor((g.index?.count ?? 0) * avance.t)));
        render();
      },
    });
    return () => void anim.kill();
  }, [c, largo, ancho, alto]);

  return <canvas ref={lienzo} className="tl-3d" aria-hidden="true" />;
}
