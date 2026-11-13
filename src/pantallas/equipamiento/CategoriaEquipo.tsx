'use client';
// H0-EquipoCategoria (lote 2.4): las herramientas de una categoría con su estado (dónde está, qué le pasa). Se busca por
// nombre o marca; tocás una para ver el detalle. La acción principal es sumar otra.
import { api } from '@handyx/origen-datos';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_EQUIPO, type CategoriaEquipo } from '../../contracts/equipamiento.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Buscador } from '../../ui/moleculas/Controles.tsx';
import { CajaHerramientas } from '../../ui/ilustraciones/Herramientas.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { EstadoVacio } from '../../ui/organismos/EstadosPantalla.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { ListaHerramientas } from './Equipamiento.tsx';
import { CATEGORIA, cantidadCategoria, tomarAviso } from './vista.ts';
import './equipamiento.css';

export function categoriaDe(q: string | null): CategoriaEquipo {
  return (CATEGORIAS_EQUIPO as readonly string[]).includes(q ?? '') ? (q as CategoriaEquipo) : 'electricas';
}

export function CategoriaEquipo() {
  const categoria = categoriaDe(useSearchParams().get('c'));
  const c = useCarga(() => api.equipamientoItems({ categoria }), [categoria]);
  const [busqueda, setBusqueda] = useState('');
  const [aviso] = useState(tomarAviso);
  const nombre = CATEGORIA[categoria].nombre;

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const q = busqueda.trim().toLocaleLowerCase('es');
  const items = c.datos.items.filter((i) => !q || `${i.nombre} ${i.marcaModelo ?? ''}`.toLocaleLowerCase('es').includes(q));
  const cant = cantidadCategoria(categoria, c.datos.items.length);

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={nombre} subtitulo={`${cant.numero} ${cant.unidad}`} hrefVolver={RUTAS.equipamiento.ruta} />}
      accion={
        <AccionFija>
          <BotonEnlace icono="mas" href={`${RUTAS.equipamientoAgregar.ruta}?c=${categoria}`}>
            Agregar una herramienta
          </BotonEnlace>
        </AccionFija>
      }
    >
      {aviso ? <AvisoCaja tono="exito">{aviso}</AvisoCaja> : null}
      {c.datos.items.length > 0 ? <Buscador valor={busqueda} onCambio={setBusqueda} etiqueta={`Buscar en ${nombre.toLocaleLowerCase('es')}`} ejemplo="Buscar en tu equipamiento" /> : null}
      {items.length > 0 ? (
        <ListaHerramientas items={items} />
      ) : (
        <EstadoVacio ilustracion={<CajaHerramientas tam="chico" />} titulo={q ? 'No encontramos nada' : 'Todavía no cargaste nada acá'}>
          {q ? 'Probá con otra palabra o con la marca.' : 'Sumá lo que tenés con una foto o con el código de barras.'}
        </EstadoVacio>
      )}
    </PantallaSecundaria>
  );
}
