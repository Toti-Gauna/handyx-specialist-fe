'use client';
// D6-Bienvenida (lote 1.1): la primera pantalla sin sesión. Arriba, Mar del Plata de noche que se arma edificio por
// edificio (quieta con «reducir movimiento»); abajo, qué es Handyx en una línea y dos caminos: «Crear cuenta» (el
// registro, lote 1.2) o «Ya tengo cuenta». Sin láminas para pasar: todo se lee de una vez.
import { RUTAS } from '../../app/rutas.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Bajada } from '../../ui/atomos/Bajada.tsx';
import { Etiqueta, Titulo } from '../../ui/atomos/Texto.tsx';
import { AccionesFijas } from '../../ui/organismos/Acciones.tsx';
import { EscenaCiudad } from '../../ui/organismos/EscenaCiudad.tsx';
import { PantallaAcceso } from '../../ui/plantillas/PantallaAcceso.tsx';

const ACCIONES = ['Crear cuenta', 'Ya tengo cuenta'] as const;

export function Bienvenida() {
  return (
    <PantallaAcceso
      escena={<EscenaCiudad tam="alta" marca />}
      accion={
        <AccionesFijas textos={ACCIONES}>
          <BotonEnlace href={RUTAS.registro.ruta}>{ACCIONES[0]}</BotonEnlace>
          <BotonEnlace variante="contorno" href={RUTAS.acceso.ruta}>
            {ACCIONES[1]}
          </BotonEnlace>
        </AccionesFijas>
      }
    >
      <Etiqueta>Para especialistas de Mar del Plata</Etiqueta>
      <Titulo antes="Tu trabajo, " marcado="tus precios" />
      <Bajada>Recibí pedidos de tu zona, cotizá a tu manera y cobrá directo. Vos elegís qué trabajos tomar.</Bajada>
    </PantallaAcceso>
  );
}
