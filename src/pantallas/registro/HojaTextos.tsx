'use client';
// Resumen de los textos que se aceptan al crear la cuenta (RG-1) y al mandar el alta (RG-10). Provisorios: el texto
// definitivo lo aprueba Legal antes de producción.
import { AVISO_PROVISORIO } from '../../lib/legales.ts';
import { RESUMEN_PRIVACIDAD, RESUMEN_TERMINOS } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';

export function HojaTextos({ abierta, onCerrar }: { abierta: boolean; onCerrar(): void }) {
  return (
    <Hoja
      abierta={abierta}
      titulo="Términos y privacidad"
      onCerrar={onCerrar}
      pie={
        <Boton variante="contorno" onClick={onCerrar}>
          Volver
        </Boton>
      }
    >
      <Etiqueta como="h3">Términos de uso</Etiqueta>
      <ul className="rg-lista">
        {RESUMEN_TERMINOS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <Etiqueta como="h3">Aviso de privacidad</Etiqueta>
      <ul className="rg-lista">
        {RESUMEN_PRIVACIDAD.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="rg-nota">{AVISO_PROVISORIO}</p>
    </Hoja>
  );
}
