'use client';
// H0-EquipoAgregar (lote 2.4): sumar una herramienta con una foto o con el código de barras. Lo mínimo: nombre,
// categoría y dónde está; según la categoría, cuánto hay y el mínimo (consumibles y repuestos) o cuándo vence
// (seguridad); y si querés, el recordatorio de mantenimiento. La foto se achica y pierde los metadatos en el teléfono;
// el código se lee en el teléfono y el servidor solo sugiere un nombre (sin precios).
import { api, sensoresPrueba } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_EQUIPO, UBICACIONES_EQUIPO, type CategoriaEquipo, type UbicacionEquipo } from '../../contracts/equipamiento.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo, Interruptor } from '../../ui/atomos/Controles.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Stepper } from '../../ui/moleculas/Controles.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { LectorCodigo } from '../../ui/organismos/LectorCodigo.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { categoriaDe } from './CategoriaEquipo.tsx';
import { CATEGORIA, dejarAviso, UBICACION } from './vista.ts';
import './equipamiento.css';

const CADA = [
  { valor: '30', texto: 'Cada mes' },
  { valor: '90', texto: 'Cada 3 meses' },
  { valor: '180', texto: 'Cada 6 meses' },
  { valor: '365', texto: 'Cada año' },
] as const;
type Cada = (typeof CADA)[number]['valor'];

const MANTENIMIENTO: Record<CategoriaEquipo, string> = {
  electricas: 'Revisar las escobillas',
  manuales: 'Revisar y limpiar',
  medicion: 'Calibrar',
  seguridad: 'Revisar el estado',
  consumibles: 'Revisar',
  repuestos: 'Revisar',
};
const conCantidad = (c: CategoriaEquipo) => c === 'consumibles' || c === 'repuestos';

export function AgregarEquipo() {
  const router = useRouter();
  const inicial = useSearchParams().get('c');
  const [categoria, setCategoria] = useState<CategoriaEquipo>(inicial ? categoriaDe(inicial) : 'electricas');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState<UbicacionEquipo>('camioneta');
  const [cantidad, setCantidad] = useState(1);
  const [minimo, setMinimo] = useState(0);
  const [vence, setVence] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [queHacer, setQueHacer] = useState('');
  const [cada, setCada] = useState<Cada>('180');
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [errores, setErrores] = useState<{ nombre?: string; que?: string }>({});
  const archivo = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const guardar = useAccion();
  const buscar = useAccion();
  const preparar = useAccion();

  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.url);
  }, [foto]);

  async function elegirFoto(f: File | undefined) {
    if (!f) return;
    const r = await preparar.ejecutar(() => prepararFoto(f));
    if (archivo.current) archivo.current.value = '';
    if (r.ok) setFoto({ blob: r.valor, url: URL.createObjectURL(r.valor) });
  }

  async function alLeer(c: string) {
    const r = await buscar.ejecutar(() => api.sugerenciaCodigo(c));
    if (!r.ok) return;
    setCodigo(c);
    setLeyendo(false);
    if (r.valor.nombre) {
      setNombre(r.valor.nombre);
      if (r.valor.categoria) setCategoria(r.valor.categoria);
      setSugerencia(`Leímos el código ${c}: «${r.valor.nombre}». Revisá el nombre y cambialo si querés.`);
    } else setSugerencia(`Leímos el código ${c}, pero no está en el catálogo. Escribí el nombre.`);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err: typeof errores = {};
    if (!nombre.trim()) err.nombre = 'Escribí el nombre de la herramienta.';
    if (recordar && !queHacer.trim()) err.que = 'Escribí qué hay que hacer.';
    setErrores(err);
    if (err.nombre || err.que) return enfocarPrimerError(formulario.current);
    const cuenta = conCantidad(categoria);
    const r = await guardar.ejecutar(() =>
      api.agregarEquipamiento(
        {
          nombre: nombre.trim(),
          categoria,
          marcaModelo: null,
          codigoBarras: codigo,
          ubicacion,
          compradaEn: null,
          garantiaHasta: null,
          venceEn: categoria === 'seguridad' && vence ? vence : null,
          cantidad: cuenta ? cantidad : null,
          unidad: cuenta ? 'unidad' : null,
          minimo: cuenta ? minimo : null,
          mantenimiento: recordar ? { descripcion: queHacer.trim(), cadaDias: Number(cada) } : null,
        },
        foto?.blob ?? null,
        guardar.clave(),
      ),
    );
    if (r.ok) {
      dejarAviso(`Sumaste «${r.valor.nombre}» a tu equipamiento.`);
      router.push(`${RUTAS.equipamientoCategoria.ruta}?c=${r.valor.categoria}`);
    }
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Agregar herramienta" hrefVolver={`${RUTAS.equipamientoCategoria.ruta}?c=${categoria}`} />}
      accion={
        <AccionFija>
          <Boton type="submit" form="form-equipo" ocupado={guardar.pendiente} textoOcupado="Guardando…">
            Guardar en tu equipamiento
          </Boton>
        </AccionFija>
      }
    >
      <div className="eq-foto">
        <button type="button" className="eq-foto__boton" onClick={() => archivo.current?.click()} aria-describedby="eq-foto-ayuda" disabled={preparar.pendiente}>
          {foto ? <img src={foto.url} alt="La foto de la herramienta" /> : <Icono nombre="camara" tam="grande" />}
          <span>{foto ? 'Cambiar' : 'Foto'}</span>
        </button>
        <p id="eq-foto-ayuda">Con la foto la reconocés rápido. Se achica y pierde la ubicación en tu teléfono.</p>
        <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="visualmente-oculto" tabIndex={-1} aria-hidden="true" onChange={(e) => void elegirFoto(e.target.files?.[0])} />
      </div>
      {preparar.fallo ? <ErrorCaja fallo={preparar.fallo} /> : null}
      <Boton variante="contorno" icono="escaner" onClick={() => setLeyendo(true)}>
        {codigo ? `Código ${codigo} · leer otro` : 'Leer el código de barras'}
      </Boton>
      {sugerencia ? <AvisoCaja tono="info">{sugerencia}</AvisoCaja> : null}
      <form id="form-equipo" ref={formulario} className="eq-form" onSubmit={(e) => void enviar(e)} noValidate>
        <Campo etiqueta="Nombre" placeholder="Ej.: Amoladora 115 mm" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre ?? null} maxLength={80} autoComplete="off" />
        <PastillasOpcion leyenda="Categoría" opciones={CATEGORIAS_EQUIPO.map((c) => ({ valor: c, texto: CATEGORIA[c].nombre }))} valores={[categoria]} onCambio={(v) => setCategoria(v[0] ?? categoria)} />
        <PastillasOpcion leyenda="¿Dónde está?" opciones={UBICACIONES_EQUIPO.map((u) => ({ valor: u, texto: UBICACION[u].texto }))} valores={[ubicacion]} onCambio={(v) => setUbicacion(v[0] ?? ubicacion)} />
        {conCantidad(categoria) ? (
          <div className="eq-form__fila">
            <Stepper etiqueta="Cuántos tenés" valor={cantidad} onCambio={setCantidad} min={0} max={9999} />
            <Stepper etiqueta="Avisarme si quedan menos de" valor={minimo} onCambio={setMinimo} min={0} max={9999} />
          </div>
        ) : null}
        {categoria === 'seguridad' ? <Campo etiqueta="Vence el (si vence)" type="date" value={vence} onChange={(e) => setVence(e.target.value)} ayuda="Matafuego, botiquín, arnés: te avisamos antes." /> : null}
        <Interruptor
          encendido={recordar}
          etiqueta="Recordarme el mantenimiento"
          onCambio={(v) => {
            setRecordar(v);
            if (v && !queHacer) setQueHacer(MANTENIMIENTO[categoria]);
          }}
        />
        {recordar ? (
          <>
            <Campo etiqueta="Qué hay que hacer" value={queHacer} onChange={(e) => setQueHacer(e.target.value)} error={errores.que ?? null} maxLength={80} autoComplete="off" />
            <PastillasOpcion leyenda="Cada cuánto" opciones={CADA} valores={[cada]} onCambio={(v) => setCada(v[0] ?? cada)} />
          </>
        ) : null}
      </form>
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
      <Hoja abierta={leyendo} titulo="Leer el código de barras" onCerrar={() => setLeyendo(false)}>
        {leyendo ? <LectorCodigo simulada={sensoresPrueba} ocupado={buscar.pendiente} onCodigo={(c) => void alLeer(c)} /> : null}
        {buscar.fallo ? <ErrorCaja fallo={buscar.fallo} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}
