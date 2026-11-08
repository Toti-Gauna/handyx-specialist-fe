'use client';
// Mantiene el foco del teclado dentro de la hoja o el modal abierto (kit v3): con Tab, del último control vuelve al
// primero, y con Mayús+Tab, del primero al último. El <dialog> modal ya deja inerte lo de atrás, pero el navegador
// manda el foco a su propia barra antes de volver; así nunca se pierde. Se monta una vez por layout. Pendiente para el
// cierre de la ola 1: llevar esto adentro de `Hoja` y `ModalFlotante`.
import { useEffect } from 'react';

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FocoEnDialogos() {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const d = document.querySelector<HTMLDialogElement>('dialog[open]');
      if (!d) return;
      const lista = [...d.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((x) => x.offsetParent !== null || x === document.activeElement);
      const primero = lista[0];
      const ultimo = lista.at(-1);
      if (!primero || !ultimo) return;
      const actual = document.activeElement;
      if (e.shiftKey && (actual === primero || !d.contains(actual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (actual === ultimo || !d.contains(actual))) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);
  return null;
}
