import { RUTAS, type ClaveRuta } from '../app/rutas.ts';

// Ruta reservada del esqueleto (lote 1.1). Dice qué lote la construye: no simula una pantalla terminada.
export function PantallaPendiente({ clave }: { clave: ClaveRuta }) {
  const r = RUTAS[clave];
  return (
    <section className="pendiente" aria-labelledby="titulo-pantalla">
      <h1 id="titulo-pantalla" className="titulo">
        {r.titulo}
      </h1>
      <p>{r.descripcion}</p>
      <p className="pendiente__lote">Pantalla en construcción · lote {r.lote}</p>
    </section>
  );
}
