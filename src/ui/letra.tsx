'use client';
// «Letra más grande»: la preferencia vive en el servidor (preferencias de la cuenta), nunca en el navegador. Esta pieza la
// lee al abrir la app y la aplica a todo el kit; la pantalla de Cuenta usa `aplicarLetraGrande` al cambiarla.
import { api } from '@handyx/origen-datos';
import { useEffect } from 'react';
import './letra.css';

/** Enciende o apaga la letra grande en toda la app (atributo de <html>, sin tocar el almacenamiento del navegador). */
export function aplicarLetraGrande(grande: boolean): void {
  if (typeof document === 'undefined') return;
  if (grande) document.documentElement.dataset.letra = 'grande';
  else delete document.documentElement.dataset.letra;
}

export function LetraGrande() {
  useEffect(() => {
    let vivo = true;
    // Si no se puede leer, queda el tamaño normal: nunca se inventa una preferencia.
    api
      .preferencias()
      .then((p) => vivo && aplicarLetraGrande(p.letraGrande === true))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return null;
}
