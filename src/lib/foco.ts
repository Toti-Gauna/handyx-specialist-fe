/**
 * Después de validar un formulario con errores, lleva el foco al primer campo marcado (aria-invalid): el lector de
 * pantalla anuncia la etiqueta y el error asociado, y en el teclado del celular queda listo para corregir.
 * Doble requestAnimationFrame: espera a que React pinte los aria-invalid nuevos.
 */
export function enfocarPrimerError(raiz: ParentNode | null): void {
  if (!raiz) return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      raiz.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }),
  );
}
