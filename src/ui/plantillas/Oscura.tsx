// Plantilla oscura del kit v3 (lote 2.4, T-Nivel): fondo noche a pantalla completa, Volver y un chip arriba, y el
// contenido en columna. Para herramientas que se usan mirando un instrumento (nivel, plomada). Sin barra de pestañas.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import '../herramientas.css';

export function PantallaOscura({ titulo, hrefVolver, chip, children }: { titulo: string; hrefVolver: string; chip?: ReactNode; children: ReactNode }) {
  return (
    <div className="ui-pantalla-oscura">
      <header className="ui-camara__arriba">
        <Link href={hrefVolver} className="ui-camara__volver" aria-label="Volver">
          <Icono nombre="atras" />
        </Link>
        <h1 className="ui-pantalla-oscura__titulo">{titulo}</h1>
        {chip ? <span className="ui-camara__chip">{chip}</span> : null}
      </header>
      <div className="ui-pantalla-oscura__contenido">{children}</div>
    </div>
  );
}
