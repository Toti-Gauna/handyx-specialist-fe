'use client';
// Material nuevo (H0-MaterialNuevo, lote 2.2): si lo que buscás no está en tu lista, lo cargás con lo básico (nombre,
// categoría, precio que pagaste y por qué unidad). Queda guardado en tu lista y, si el nombre no estaba, se propone al
// catálogo de Handyx para que otros lo encuentren (lo revisa el equipo). Tu precio nunca sale de tu lista.
// Con `?id=` (desde un presupuesto) además lo agrega; sin `?id=` (desde la lista de precios) solo lo guarda.
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_PRECIO, type CategoriaPrecio, type MaterialCatalogo } from '../../contracts/presupuestos.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { centavosDesdeTexto, pesosDesdeCentavos } from '../../lib/formato.ts';
import { NOMBRE_CATEGORIA, OPCIONES_UNIDAD } from '../../presupuestos/vista.ts';
import type { Unidad } from '../../presupuestos/lectura.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { Seleccion } from '../../ui/atomos/Seleccion.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { rutaPresupuesto } from './comunes.tsx';
import './presupuestos.css';

const FORM = 'material-nuevo';
const CATEGORIAS = CATEGORIAS_PRECIO.map((c) => ({ valor: c, texto: NOMBRE_CATEGORIA[c] }));

export function MaterialNuevo() {
  const q = useSearchParams();
  const presupuestoId = q.get('id');
  const router = useRouter();
  const buscado = (q.get('nombre') ?? '').slice(0, 120);
  const [nombre, setNombre] = useState(buscado);
  const [categoria, setCategoria] = useState<CategoriaPrecio>('plomeria');
  const [precio, setPrecio] = useState('');
  const [unidad, setUnidad] = useState<Unidad>('unidad');
  const [catalogo, setCatalogo] = useState<MaterialCatalogo | null>(null);
  const [errores, setErrores] = useState<{ nombre?: string; precio?: string }>({});
  const guardar = useAccion();
  const texto = nombre.trim();
  const sugerencias = useCarga(() => (texto.length >= 3 && !catalogo ? api.buscarCatalogo(texto) : Promise.resolve([])), [texto, catalogo]);
  const centavos = centavosDesdeTexto(precio);
  const volver = presupuestoId ? `${RUTAS.presupuestoMaterial.ruta}?id=${presupuestoId}` : RUTAS.precios.ruta;

  function elegir(c: MaterialCatalogo) {
    setCatalogo(c);
    setNombre(c.nombre);
    setCategoria(c.categoria);
    setUnidad(c.unidad);
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err: typeof errores = {};
    if (!texto) err.nombre = 'Escribí el nombre del material.';
    if (!centavos) err.precio = 'Escribí lo que pagaste, en pesos.';
    setErrores(err);
    // Foco al primer error.
    if (err.nombre) return document.getElementById('mn-nombre')?.focus();
    if (err.precio) return document.getElementById('mn-precio')?.focus();
    const r = await guardar.ejecutar(async () => {
      const nuevo = await api.crearPrecio(
        { catalogoId: catalogo?.id ?? null, nombre: texto, categoria, unidad, costo: { centavos: centavos ?? 0, moneda: 'ARS' }, precioCliente: null, proveedor: null, modoPrecio: 'fijo', sumarAlCatalogo: catalogo === null },
        guardar.clave(),
      );
      if (!presupuestoId) return;
      const [p, o] = await Promise.all([api.presupuesto(presupuestoId), api.preferenciasMaterial()]);
      await api.agregarMateriales(presupuestoId, { materiales: [{ precioId: nuevo.id, nombre: null, unidad: null, precioUnitario: null, cantidad: 1, modoPrecio: o.modoPrecio, cobrarAlCliente: o.cobrarAlCliente, registrarGasto: o.registrarGasto }], version: p.version });
    });
    if (r.ok) router.push(presupuestoId ? rutaPresupuesto(presupuestoId) : `${RUTAS.precios.ruta}?nuevo=1`);
  }

  const textoBoton = presupuestoId ? `Guardar y agregar${centavos ? ` · ${pesosDesdeCentavos(centavos)}` : ''}` : 'Guardar en tu lista';
  const lista = (sugerencias.datos ?? []).filter((c) => c.nombre.toLowerCase() !== texto.toLowerCase()).slice(0, 3);
  const exacto = (sugerencias.datos ?? []).find((c) => c.nombre.toLowerCase() === texto.toLowerCase());

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Material nuevo" subtitulo={buscado ? 'No estaba en tu lista' : 'Para tu lista de precios'} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={guardar.pendiente} textoOcupado="Guardando…">
            {textoBoton}
          </Boton>
        </AccionFija>
      }
    >
      {buscado ? <AvisoCaja tono="info" icono="caja">{`«${buscado}» no estaba en tu lista. Completá lo básico y queda guardado.`}</AvisoCaja> : null}
      <Formulario id={FORM} onEnviar={(e) => void enviar(e)} etiqueta="Material nuevo">
        <Campo
          id="mn-nombre"
          etiqueta="Nombre"
          value={nombre}
          maxLength={120}
          autoComplete="off"
          error={errores.nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setCatalogo(null);
          }}
        />
        {lista.length > 0 ? (
          <div className="pr-seccion">
            <p className="pr-rotulo" id="sugerencias-catalogo">
              En el catálogo de Handyx
            </p>
            <ul className="pr-sugerencias" aria-labelledby="sugerencias-catalogo">
              {lista.map((c) => (
                <li key={c.id}>
                  <Boton variante="contorno" chico onClick={() => elegir(exacto ?? c)}>
                    {c.nombre}
                  </Boton>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <PastillasOpcion leyenda="Categoría" opciones={CATEGORIAS} valores={[categoria]} onCambio={(v) => v[0] && setCategoria(v[0])} />
        <div className="pr-dos">
          <Campo id="mn-precio" etiqueta="Precio que pagaste" prefijo="$" inputMode="decimal" autoComplete="off" value={precio} error={errores.precio} onChange={(e) => setPrecio(e.target.value)} />
          <Seleccion etiqueta="Por" value={unidad} onChange={(e) => setUnidad(e.target.value as Unidad)}>
            {OPCIONES_UNIDAD.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.texto}
              </option>
            ))}
          </Seleccion>
        </div>
      </Formulario>
      <p className="pr-pronto pr-pronto--izq">
        <Icono nombre="escudo" tam="chico" />
        {catalogo || exacto ? 'El nombre ya está en el catálogo de Handyx. Tu precio queda solo para vos.' : 'El nombre del material se suma al catálogo de Handyx para que otros lo encuentren. Tu precio queda solo para vos.'}
      </p>
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
    </PantallaSecundaria>
  );
}
