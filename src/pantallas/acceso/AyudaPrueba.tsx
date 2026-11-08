'use client';
// Ayuda amarilla de la vista previa (solo con el origen de prueba; con la API real no se muestra nada): con qué datos
// se puede recorrer el acceso sin email, SMS, Google ni Apple de verdad.
import { ayudasPrueba, credencialesPrueba } from '@handyx/origen-datos';
import type { ReactNode } from 'react';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';

export function AyudaPrueba({ que }: { que: 'clave' | 'codigo' | 'segunda' }) {
  if (!ayudasPrueba || !credencialesPrueba) return null;
  const s = ayudasPrueba.segundaVerificacion;
  let texto: ReactNode;
  if (que === 'clave')
    texto = (
      <>
        Entrá con <strong>{credencialesPrueba.email}</strong> (o el teléfono <strong>{s?.telefono ?? '223 555-4521'}</strong>) y la contraseña <strong>{credencialesPrueba.password}</strong>.
        {s ? (
          <>
            {' '}
            Con <strong>{s.email}</strong> te pide la segunda verificación.
          </>
        ) : null}
      </>
    );
  else if (que === 'codigo')
    texto = (
      <>
        No se manda ningún email ni SMS: el código es <strong>{ayudasPrueba.codigoEmail}</strong>.
      </>
    );
  else
    texto = (
      <>
        El código de la app (o del SMS o el email) es <strong>{ayudasPrueba.codigoEmail}</strong>
        {s ? (
          <>
            ; un código de respaldo: <strong>{s.codigoRespaldo}</strong>
          </>
        ) : null}
        .
      </>
    );
  return (
    <AvisoCaja tono="prueba" titulo="Vista previa con datos de prueba">
      {texto}
    </AvisoCaja>
  );
}
