// Encabezado de pantalla del kit v3 (lote 1.1): rótulo chico, título con su parte marcada y la bajada, juntos y con
// un solo h1 (con `nivel={2}` cuando la barra compacta ya tiene el h1 de la pantalla). `centrado` para las pantallas con el mosaico de la escena encima (D6-Acceso, D6-Codigo).
import type { ReactNode } from 'react';
import { Bajada } from '../atomos/Bajada.tsx';
import { Etiqueta, Titulo } from '../atomos/Texto.tsx';

export function Encabezado({ etiqueta, antes, marcado, despues, bajada, centrado = false, tam = 'grande', nivel = 1 }: { nivel?: 1 | 2; etiqueta?: string; antes?: ReactNode; marcado?: ReactNode; despues?: ReactNode; bajada?: ReactNode; centrado?: boolean; tam?: 'grande' | 'medio' }) {
  return (
    <div className={`ui-encabezado${centrado ? ' ui-encabezado--centrado' : ''}`}>
      {etiqueta ? <Etiqueta>{etiqueta}</Etiqueta> : null}
      <Titulo antes={antes} marcado={marcado} despues={despues} tam={tam} nivel={nivel} />
      {bajada ? <Bajada>{bajada}</Bajada> : null}
    </div>
  );
}
