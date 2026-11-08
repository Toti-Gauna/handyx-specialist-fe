'use client';
// X-Escritorio: la app del especialista es solo para el celular. Desde una computadora (≥ 900 px y mouse) se ve esto:
// por qué, un QR local (uqr, sin servicios externos y sin datos personales: solo la dirección de la app) y una vista de
// muestra del celular. La vista de muestra no es tocable ni tiene datos.
import { encode } from 'uqr';
import { useEffect, useState } from 'react';
import { Etiqueta, Marcador } from '../atomos/Texto.tsx';
import { Icono } from '../atomos/Icono.tsx';
import { Ciudad } from '../ilustraciones/Ciudad.tsx';
import { caminoQr } from '../logica.ts';

function useDireccion(): string | null {
  const [dir, setDir] = useState<string | null>(null);
  useEffect(() => {
    // Solo el origen y la ruta: nunca la query (puede traer un id o un escenario de prueba).
    setDir(`${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`);
  }, []);
  return dir;
}

export function Qr({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const qr = encode(texto, { ecc: 'M' });
  const lado = qr.size + 4;
  return (
    <svg className="ui-qr" viewBox={`0 0 ${lado} ${lado}`} role="img" aria-label={etiqueta} shapeRendering="crispEdges">
      <rect width={lado} height={lado} fill="#fff" />
      <path d={caminoQr(qr.data)} fill="#0E1D36" />
    </svg>
  );
}

export function PantallaEscritorio() {
  const dir = useDireccion();
  return (
    <div className="ui-escritorio">
      <header className="ui-escritorio__cabecera">
        <span className="ui-escritorio__logo">Handyx</span>
        <span className="ui-escritorio__solo">
          <Icono nombre="telefono" /> App para especialistas · solo en el celular
        </span>
      </header>
      <main id="contenido" className="ui-escritorio__cuerpo">
        <section className="ui-escritorio__texto">
          <Etiqueta>Estás en una computadora</Etiqueta>
          <h1 className="ui-titulo ui-escritorio__titulo">
            Handyx se usa desde el <Marcador>celular</Marcador>
          </h1>
          <p>La app del especialista está pensada para el trabajo en la calle: el mapa, la cámara, el nivel y los avisos funcionan en el teléfono. Desde la computadora te mostramos una vista de muestra.</p>
          <div className="ui-escritorio__qr">
            {dir ? <Qr texto={dir} etiqueta="Código QR para abrir la app en el celular" /> : <span className="ui-qr ui-qr--vacio" />}
            <span>
              <strong>Escaneá con tu celular</strong>
              <span>Se abre la app y la podés instalar en la pantalla de inicio.</span>
              {dir ? <span className="ui-escritorio__dir">{dir}</span> : null}
            </span>
          </div>
        </section>
        <figure className="ui-escritorio__muestra">
          <div className="ui-escritorio__telefono" aria-hidden="true">
            <div className="ui-escritorio__pantalla">
              <Ciudad tam="lleno" />
              <span className="ui-escritorio__marca">
                <span>Handyx</span>
                <small>Soluciones, no problemas</small>
              </span>
              <span className="ui-etiqueta">Para especialistas de Mar del Plata</span>
              <span className="ui-titulo ui-titulo--medio">
                Tu trabajo, <Marcador>tus precios</Marcador>
              </span>
              <span className="ui-escritorio__bajada">Recibí pedidos de tu zona, cotizá a tu manera y cobrá directo. Vos elegís qué trabajos tomar.</span>
              <span className="ui-escritorio__falso ui-escritorio__falso--azul">Crear cuenta</span>
              <span className="ui-escritorio__falso">Ya tengo cuenta</span>
            </div>
          </div>
          <figcaption>
            <strong>Vista de muestra</strong>
            <span>La columna replica el celular, en vertical y acortada. Para trabajar, usá el teléfono.</span>
          </figcaption>
        </figure>
      </main>
    </div>
  );
}
