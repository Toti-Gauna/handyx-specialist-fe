// Escena del modelo escaneado en el teléfono (lote 2.4, T-Modelo3D): la malla que armó src/herramientas/escaneo.ts con
// el material claro de la marca, la sombra de contacto y sus cotas (alto y diámetro, o alto, ancho y fondo). Unidades:
// metros, origen en el centro de la base. Las medidas siempre «aprox.»: lo dice la pantalla al lado.
import * as THREE from 'three';
import type { Malla, MedidasEscaneo } from '../herramientas/escaneo.ts';
import { cotaAlto, cotaAncho, cotaDiametro, formatearDiametro, formatearMedida } from './cotas.ts';
import { crearSombraContacto } from './marca.ts';
import type { MontarEscena } from './motor.ts';
import { crearCota } from './primitivas/cotas3d.ts';

export function escenaModeloEscaneado(m: { malla: Malla; medidas: MedidasEscaneo }, o: { cotas?: boolean } = {}): MontarEscena {
  return (ctx) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(m.malla.posiciones, 3));
    geo.setIndex(new THREE.BufferAttribute(m.malla.indices, 1));
    geo.computeVertexNormals();
    const cuerpo = new THREE.Mesh(geo, ctx.materiales.superficie);
    cuerpo.name = 'modelo-escaneado';
    ctx.raiz.add(cuerpo);
    const { altoM, diametroM, anchoM, fondoM } = m.medidas;
    const mitadX = (diametroM ?? anchoM ?? 0.4) / 2;
    const mitadZ = (diametroM ?? fondoM ?? 0.4) / 2;
    ctx.raiz.add(crearSombraContacto(Math.max(mitadX, mitadZ) * 1.6));
    if (o.cotas !== false) {
      const cotas = new THREE.Group();
      cotas.name = 'cotas';
      cotas.add(crearCota(cotaAlto({ min: [-mitadX, 0, -mitadZ], max: [mitadX, altoM, 0] }, 0.1), formatearMedida(altoM), ctx.materiales));
      if (diametroM !== null) cotas.add(crearCota(cotaDiametro([0, 0, 0], diametroM / 2, altoM, 0.08), formatearDiametro(diametroM), ctx.materiales));
      else cotas.add(crearCota(cotaAncho({ min: [-mitadX, 0, -mitadZ], max: [mitadX, altoM, mitadZ] }, 0.08), formatearMedida(anchoM ?? 0), ctx.materiales));
      ctx.raiz.add(cotas);
    }
    ctx.encuadrar([0, altoM / 2, 0], Math.max(altoM / 2, mitadX, mitadZ) * 1.25);
  };
}

/** El modelo en GLB (para guardarlo en un trabajo o compartirlo): solo la malla, sin cotas ni texturas. */
export async function glbDelModelo(malla: Malla, nombre: string): Promise<Blob> {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(malla.posiciones, 3));
  geo.setIndex(new THREE.BufferAttribute(malla.indices, 1));
  geo.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = nombre;
  try {
    const datos = await new GLTFExporter().parseAsync(mesh, { binary: true });
    return new Blob([datos as ArrayBuffer], { type: 'model/gltf-binary' });
  } finally {
    geo.dispose();
    material.dispose();
  }
}
