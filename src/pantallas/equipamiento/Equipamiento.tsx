'use client';
// H0-Equipo (lote 2.4): tu equipamiento por categoría, con dónde está cada cosa, lo que hay que mantener y lo que queda
// poco. Los mosaicos llevan a cada categoría; las pastillas muestran lo que está en la camioneta, en el taller o
// prestado. La franja amarilla abre la lista de compras. Solo lo ve el especialista.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_EQUIPO, type ItemEquipo } from '../../contracts/equipamiento.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BotonIconoEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip, Etiqueta, Titulo } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { FilaHerramienta, FranjaAviso, GrillaCategorias, MosaicoCategoria } from '../../ui/moleculas/Equipo.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { BarraPestanas } from '../../ui/organismos/BarraPestanas.tsx';
import { EstadoVacio } from '../../ui/organismos/EstadosPantalla.tsx';
import { PantallaRaiz } from '../../ui/plantillas/Plantillas.tsx';
import { CajaHerramientas } from '../../ui/ilustraciones/Herramientas.tsx';
import '../../ui/moleculas/ajustes.css';
import { HojaCompras } from './HojaCompras.tsx';
import { CATEGORIA, cantidadCategoria, chipsHerramienta, detalleHerramienta, textoCompras, tomarAviso, tonoCategoria } from './vista.ts';
import './equipamiento.css';

type Filtro = 'todo' | 'camioneta' | 'taller' | 'prestados';
const FILTROS: readonly { valor: Filtro; texto: string }[] = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'camioneta', texto: 'En la camioneta' },
  { valor: 'taller', texto: 'En el taller' },
  { valor: 'prestados', texto: 'Prestado' },
];

export const hrefHerramienta = (id: string) => `${RUTAS.equipamientoHerramienta.ruta}?id=${encodeURIComponent(id)}`;

export function ListaHerramientas({ items }: { items: readonly ItemEquipo[] }) {
  return (
    <Tarjeta como="div">
      {items.map((i) => (
        <FilaHerramienta
          key={i.id}
          icono={CATEGORIA[i.categoria].icono}
          foto={i.foto?.url ?? null}
          titulo={i.nombre}
          detalle={detalleHerramienta(i)}
          href={hrefHerramienta(i.id)}
          chips={chipsHerramienta(i).map((c) => (
            <Chip key={c.texto} tono={c.tono} icono={c.icono}>
              {c.texto}
            </Chip>
          ))}
        />
      ))}
    </Tarjeta>
  );
}

export function Equipamiento() {
  const resumen = useCarga(() => api.equipamiento(), []);
  const compras = useCarga(() => api.listaCompras(), []);
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const lista = useCarga(() => (filtro === 'todo' ? Promise.resolve(null) : api.equipamientoItems(filtro === 'prestados' ? { prestados: true } : { ubicacion: filtro })), [filtro]);
  const [verCompras, setVerCompras] = useState(false);
  const [aviso] = useState(tomarAviso);

  if (resumen.fallo && !resumen.datos) return <ErrorCaja pantalla fallo={resumen.fallo} onReintentar={() => void resumen.recargar()} />;
  if (!resumen.datos) return <Cargando />;
  const r = resumen.datos;
  const mayor = [...r.categorias].sort((a, b) => b.cantidad - a.cantidad)[0]?.categoria ?? null;
  const nombres = (compras.datos ?? []).map((c) => c.nombre);

  return (
    <PantallaRaiz>
      <div className="eq-cabecera">
        <div className="eq-cabecera__titulo">
          <Etiqueta>Herramientas y consumibles</Etiqueta>
          <Titulo antes="Tu " marcado="equipamiento" />
        </div>
        <BotonIconoEnlace icono="mas" tono="azul" etiqueta="Agregar una herramienta" href={RUTAS.equipamientoAgregar.ruta} />
      </div>
      {aviso ? <AvisoCaja tono="exito">{aviso}</AvisoCaja> : null}
      <PastillasOpcion leyenda="Mostrar" leyendaVisible={false} opciones={FILTROS} valores={[filtro]} onCambio={(v) => setFiltro(v[0] ?? 'todo')} />
      {filtro === 'todo' ? (
        <GrillaCategorias etiqueta="Categorías de tu equipamiento">
          {CATEGORIAS_EQUIPO.map((c) => {
            const dato = r.categorias.find((x) => x.categoria === c) ?? { categoria: c, cantidad: 0, alerta: null };
            const cant = cantidadCategoria(c, dato.cantidad);
            return <MosaicoCategoria key={c} icono={CATEGORIA[c].icono} titulo={CATEGORIA[c].nombre} cantidad={dato.cantidad} unidad={cant.unidad} alerta={dato.alerta} tono={tonoCategoria(dato, mayor)} href={`${RUTAS.equipamientoCategoria.ruta}?c=${c}`} />;
          })}
        </GrillaCategorias>
      ) : lista.fallo && !lista.datos ? (
        <ErrorCaja fallo={lista.fallo} onReintentar={() => void lista.recargar()} />
      ) : !lista.datos ? (
        <Cargando />
      ) : lista.datos.items.length === 0 ? (
        <EstadoVacio ilustracion={<CajaHerramientas tam="chico" />} titulo={filtro === 'prestados' ? 'No tenés nada prestado' : 'No hay nada acá'}>
          Cuando muevas o prestes algo, lo vas a ver en esta lista.
        </EstadoVacio>
      ) : (
        <ListaHerramientas items={lista.datos.items} />
      )}
      {r.listaCompras > 0 ? (
        <FranjaAviso icono="carrito" onClick={() => setVerCompras(true)}>
          {textoCompras(nombres)}
        </FranjaAviso>
      ) : null}
      <p className="ui-nota">Solo lo ves vos. Los clientes no ven tu equipamiento.</p>
      <HojaCompras
        abierta={verCompras}
        lista={compras.datos ?? []}
        onCerrar={() => setVerCompras(false)}
        onCambio={async () => {
          await Promise.all([compras.recargar(), resumen.recargar()]);
        }}
      />
      <BarraPestanas />
    </PantallaRaiz>
  );
}
