import Link from 'next/link';
import { Handy } from '../components/Handy.tsx';
import { RUTAS } from './rutas.ts';

export default function NoEncontrada() {
  return (
    <main id="contenido" className="app-cuerpo app-cuerpo--centro">
      <section className="vacio">
        <Handy nombre="llave-rota" alto={110} className="handy--tambalea" />
        <h1 className="titulo">No encontramos esta pantalla</h1>
        <Link className="boton" href={RUTAS.inicio.ruta}>
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
