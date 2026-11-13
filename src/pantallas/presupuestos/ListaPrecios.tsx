'use client';
// Tu lista de precios (H0-Precios, lote 2.2): lo que te cuestan los materiales y lo que cobrás de mano de obra, por
// categoría, con lo que se actualiza, lo que fijaste y lo que quedó viejo. Para sumar precios: la foto de la lista del
// corralón (se lee en el teléfono) o a mano. El catálogo de las ferreterías llega con la ola 4.
import { api } from '@handyx/origen-datos';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_PRECIO, type CategoriaPrecio, type PrecioMaterial } from '../../contracts/presupuestos.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { plural } from '../../lib/formato.ts';
import { antiguedad, NOMBRE_CATEGORIA } from '../../presupuestos/vista.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip, Cifra, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { FilaMetodo, ResumenTarjeta } from '../../ui/moleculas/Ajustes.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Buscador } from '../../ui/moleculas/Controles.tsx';
import { CabeceraSeccion } from '../../ui/moleculas/Materiales.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { ChipModo, hoyLocal, iconoCategoria } from './comunes.tsx';
import './presupuestos.css';

type Filtro = CategoriaPrecio | 'todas' | 'viejos';

export function ListaPrecios() {
  const q = useSearchParams();
  const guardados = Number(q.get('guardados') ?? '0');
  const nuevo = q.get('nuevo') === '1';
  const lista = useCarga(() => api.precios(), []);
  const mano = useCarga(() => api.manoDeObra(), []);
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');

  if (lista.fallo && !lista.datos) return <ErrorCaja pantalla fallo={lista.fallo} onReintentar={() => void lista.recargar()} />;
  if (!lista.datos) return <Cargando />;
  const todos = lista.datos.items;
  const hoy = hoyLocal();
  const texto = buscar.trim().toLowerCase();
  const visibles = todos.filter((p) => (filtro === 'todas' || (filtro === 'viejos' ? p.viejo : p.categoria === filtro)) && (!texto || p.nombre.toLowerCase().includes(texto)));
  const categorias = CATEGORIAS_PRECIO.filter((c) => todos.some((p) => p.categoria === c));
  const viejos = todos.filter((p) => p.viejo).length;
  const opciones = [{ valor: 'todas' as Filtro, texto: 'Todas' }, ...categorias.map((c) => ({ valor: c as Filtro, texto: NOMBRE_CATEGORIA[c] })), ...(viejos ? [{ valor: 'viejos' as Filtro, texto: `Viejos (${viejos})` }] : [])];
  const grupos = categorias.map((c) => ({ c, items: visibles.filter((p) => p.categoria === c) })).filter((g) => g.items.length > 0);

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Tu lista de precios" hrefVolver={RUTAS.taller.ruta} />}
      accion={
        <AccionFija>
          <BotonEnlace href={RUTAS.presupuestoMaterialNuevo.ruta} icono="mas">
            Agregar un precio a mano
          </BotonEnlace>
        </AccionFija>
      }
    >
      {guardados > 0 ? <AvisoCaja tono="exito">{`Guardamos ${plural(guardados, 'precio', 'precios')} de la lista.`}</AvisoCaja> : null}
      {nuevo ? <AvisoCaja tono="exito">Guardamos el material en tu lista.</AvisoCaja> : null}
      <Tarjeta tono="azul">
        <Etiqueta claro>Para qué sirve</Etiqueta>
        <p className="pr-explica">Lo que te cuestan los materiales y lo que cobrás de mano de obra. Con esto se arman tus presupuestos en segundos.</p>
      </Tarjeta>
      <div className="pr-dos">
        <ResumenTarjeta icono="caja" titulo="Materiales" detalle={plural(todos.length, 'precio', 'precios')} href="#materiales" />
        <ResumenTarjeta icono="herramienta" titulo="Mano de obra" detalle={mano.datos ? plural(mano.datos.tareas.length, 'tarifa', 'tarifas') : 'Tus tarifas'} href={RUTAS.manoDeObra.ruta} tono="amarillo" />
      </div>

      <section id="materiales" className="pr-seccion" aria-label="Materiales de tu lista">
        <Buscador valor={buscar} onCambio={setBuscar} etiqueta="Buscar en tu lista de precios" ejemplo="Buscá un material" />
        <PastillasOpcion leyenda="Mostrar" leyendaVisible={false} opciones={opciones} valores={[filtro]} onCambio={(v) => v[0] && setFiltro(v[0])} />
      </section>
      {grupos.length === 0 ? <p className="pr-nota">No hay materiales que coincidan.</p> : null}
      {grupos.map((g) => (
        <Tarjeta key={g.c}>
          <CabeceraSeccion titulo={`${NOMBRE_CATEGORIA[g.c]} · ${g.items.length}`} />
          {g.items.map((p) => (
            <FilaPrecio key={p.id} p={p} hoy={hoy} />
          ))}
        </Tarjeta>
      ))}

      <h2 className="pr-subtitulo">Sumar precios</h2>
      <FilaMetodo
        icono="camara"
        titulo="Foto de la lista del corralón"
        detalle="La leemos en tu teléfono y revisás cada precio"
        chip={
          <Chip tono="amarillo" icono="rayo">
            Rápido
          </Chip>
        }
        href={RUTAS.preciosFoto.ruta}
      />
      <FilaMetodo
        icono="tienda"
        titulo="Catálogo de ferreterías"
        detalle="Precios de las ferreterías de Mar del Plata"
        chip={
          <Chip tono="gris" icono="reloj">
            Pronto
          </Chip>
        }
        deshabilitado
      />
    </PantallaSecundaria>
  );
}

function FilaPrecio({ p, hoy }: { p: PrecioMaterial; hoy: string }) {
  return (
    <FilaIcono
      icono={iconoCategoria(p.categoria)}
      titulo={p.nombre}
      href={`${RUTAS.precioDetalle.ruta}?id=${p.id}`}
      detalle={
        <span className="pr-detalle__chips">
          <span>{antiguedad(p.actualizadoEn, hoy, false)}</span>
          {p.viejo ? (
            <Chip tono="amarillo" icono="alerta">
              {antiguedad(p.actualizadoEn, hoy, true)}
            </Chip>
          ) : (
            <ChipModo modo={p.modoPrecio} />
          )}
        </span>
      }
      derecha={<Cifra centavos={p.precioCliente.centavos} tam="chico" como="strong" />}
    />
  );
}
