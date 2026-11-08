// Plantillas del kit v3: el esqueleto de cada tipo de pantalla. Las pantallas de negocio solo eligen una y la llenan.
// - PantallaRaiz: cabecera (azul en Inicio) + contenido + barra de pestañas (la pone el layout de la app).
// - PantallaSecundaria: barra compacta con Volver + contenido + acción fija abajo (sin pestañas).
// - PantallaHoja: la pantalla de atrás se sigue viendo y el contenido va en una hoja (pedido, confirmaciones).
// - PantallaMapa: el mapa ocupa todo y encima flotan los controles; abajo, una hoja o la acción.
// El contenido deja lugar abajo para la acción fija y las pestañas (nunca queda tapado: lo mide e2e/desbordes.cjs).
import type { ReactNode } from 'react';

export function PantallaRaiz({ cabecera, children }: { cabecera?: ReactNode; children: ReactNode }) {
  return (
    <div className="ui-pantalla ui-pantalla--raiz">
      {cabecera}
      <div className="ui-pantalla__contenido">{children}</div>
    </div>
  );
}

export function PantallaSecundaria({ barra, children, accion }: { barra: ReactNode; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className={`ui-pantalla ui-pantalla--secundaria${accion ? ' ui-pantalla--con-accion' : ''}`}>
      {barra}
      <div className="ui-pantalla__contenido">{children}</div>
      {accion}
    </div>
  );
}

export function PantallaHoja({ fondo, children }: { fondo: ReactNode; children: ReactNode }) {
  return (
    <div className="ui-pantalla ui-pantalla--hoja">
      <div className="ui-pantalla__fondo">{fondo}</div>
      {children}
    </div>
  );
}

export function PantallaMapa({ mapa, arriba, abajo }: { mapa: ReactNode; arriba?: ReactNode; abajo?: ReactNode }) {
  return (
    <div className="ui-pantalla ui-pantalla--mapa">
      <div className="ui-pantalla__mapa">{mapa}</div>
      {arriba ? <div className="ui-pantalla__arriba">{arriba}</div> : null}
      {abajo ? <div className="ui-pantalla__abajo">{abajo}</div> : null}
    </div>
  );
}
