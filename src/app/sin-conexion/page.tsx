import type { Metadata } from 'next';
import { Handy } from '../../components/Handy.tsx';
import { RUTAS } from '../rutas.ts';

export const metadata: Metadata = { title: RUTAS.sinConexion.titulo };

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// La muestra el service worker cuando no hay red y la pantalla pedida no está guardada. Es HTML estático:
// no tiene datos de la cuenta ni necesita JavaScript. El enlace es una navegación completa para reintentar.
export default function SinConexion() {
  return (
    <main id="contenido" className="app-cuerpo app-cuerpo--centro">
      <section className="vacio">
        <Handy nombre="cano-roto" alto={130} className="handy--tambalea" />
        <h1 className="titulo">Se nos cortó el caño</h1>
        <p>No hay conexión. Revisá tu wifi o tus datos y probá de nuevo.</p>
        <p className="texto-suave">Mientras tanto no se puede ver ni enviar nada de tu cuenta: tus datos no quedan guardados en el teléfono.</p>
        <a className="boton" href={`${base}${RUTAS.inicio.ruta}`}>
          Probar de nuevo
        </a>
      </section>
    </main>
  );
}
