'use client';
// RG-1 (editar), RG-2 Domicilio, RG-3 Rubros y RG-4 Zonas (lote 1.2). Cada uno guarda en el servidor apenas se completa.
import { api } from '@handyx/origen-datos';
import { useState, type FormEvent } from 'react';
import { RUBROS, NOMBRE_RUBRO, requiereMatricula, type Rubro } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { plural } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { MapaBarrios } from '../../ui/ilustraciones/Registro.tsx';
import { AvisoCaja, AvisoPrivado } from '../../ui/moleculas/Avisos.tsx';
import { ICONO_RUBRO } from '../../ui/moleculas/MarcadorPedido.tsx';
import { GrillaOpciones, OpcionMosaico, PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { FalloPaso, MarcoPaso, useRegistro } from './comunes.tsx';

/** RG-1 con la cuenta ya creada: se corrigen nombre y apellido; el celular y el email se cambian desde Cuenta. */
export function PasoDatos() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [nombre, setNombre] = useState(r.datos.nombre ?? '');
  const [apellido, setApellido] = useState(r.datos.apellido ?? '');
  const [errores, setErrores] = useState<{ nombre?: string; apellido?: string }>({});

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err = { nombre: nombre.trim() ? undefined : 'Escribí tu nombre.', apellido: apellido.trim() ? undefined : 'Escribí tu apellido.' };
    setErrores(err);
    if (err.nombre || err.apellido) return enfocarPrimerError(form);
    if (nombre.trim() === r.datos.nombre && apellido.trim() === r.datos.apellido) return seguir('datos');
    const x = await ejecutar(async () => fijar(await api.guardarDatosRegistro({ nombre: nombre.trim(), apellido: apellido.trim(), version: r.version })));
    if (x.ok) seguir('datos');
  }

  return (
    <form className="rg-form" noValidate onSubmit={(e) => void guardar(e)}>
      <MarcoPaso paso="datos" antes="Contanos " marcado="quién sos" bajada="Así te ven los clientes cuando aceptan tu propuesta." volver={null} accion={<Boton type="submit" ocupado={pendiente} textoOcupado="Guardando…">Seguir</Boton>}>
        <div className="rg-par">
          <Campo etiqueta="Nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} maxLength={60} />
          <Campo etiqueta="Apellido" autoComplete="family-name" value={apellido} onChange={(e) => setApellido(e.target.value)} error={errores.apellido} maxLength={60} />
        </div>
        <Tarjeta>
          <FilaIcono icono="telefono" titulo="Celular" detalle={r.datos.telefonoEnmascarado ?? 'Sin cargar'} borde={false} />
          <FilaIcono icono="sobre" titulo="Email" detalle={r.datos.emailEnmascarado} />
        </Tarjeta>
        <p className="rg-nota">El celular y el email los cambiás desde Cuenta, con un código de verificación.</p>
        <FalloPaso fallo={fallo} />
      </MarcoPaso>
    </form>
  );
}

/** RG-2: dónde vivís. Se guarda cifrado y nunca se le muestra a nadie (vuelve solo el barrio). */
export function PasoDomicilio() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const barrios = useCarga(() => api.barrios(), []);
  const [v, setV] = useState({ calle: '', numero: '', piso: '', barrio: r.domicilio.barrio ?? '', ciudad: 'Mar del Plata' });
  const [errores, setErrores] = useState<Partial<Record<'calle' | 'numero' | 'barrio' | 'ciudad', string>>>({});
  const cambiar = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const yaCargado = r.domicilio.cargado && !v.calle && !v.numero;

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (yaCargado) return seguir('domicilio');
    const err: typeof errores = {};
    if (v.calle.trim().length < 2) err.calle = 'Escribí la calle.';
    if (!v.numero.trim()) err.numero = 'Escribí el número (o «S/N» si no tiene).';
    if (v.barrio.trim().length < 2) err.barrio = 'Escribí tu barrio.';
    if (v.ciudad.trim().length < 2) err.ciudad = 'Escribí tu ciudad.';
    setErrores(err);
    if (Object.keys(err).length) return enfocarPrimerError(form);
    const b = barrios.datos?.find((x) => x.nombre.toLowerCase() === v.barrio.trim().toLowerCase());
    const x = await ejecutar(async () =>
      fijar(await api.guardarDomicilio({ calle: v.calle.trim(), numero: v.numero.trim(), pisoDepto: v.piso.trim() || null, barrioId: b?.id ?? null, barrio: b?.nombre ?? v.barrio.trim(), ciudad: v.ciudad.trim(), punto: null, version: r.version })),
    );
    if (x.ok) seguir('domicilio');
  }

  return (
    <form className="rg-form" noValidate onSubmit={(e) => void guardar(e)}>
      <MarcoPaso paso="domicilio" antes="¿Dónde " marcado="vivís?" bajada="Para calcular distancias y verificar tu identidad. Nunca se lo mostramos a nadie." accion={<Boton type="submit" ocupado={pendiente} textoOcupado="Guardando…">Seguir</Boton>}>
        <div className="rg-mapa">
          <MapaBarrios pin tam="lleno" />
        </div>
        {r.domicilio.cargado ? (
          <AvisoCaja tono="exito" titulo={`Ya está guardado${r.domicilio.barrio ? ` · ${r.domicilio.barrio}` : ''}`}>
            Si te mudaste, escribí el nuevo. Por seguridad no te mostramos el que cargaste.
          </AvisoCaja>
        ) : null}
        <Campo etiqueta="Calle" icono="casa2" autoComplete="address-line1" value={v.calle} onChange={cambiar('calle')} error={errores.calle} maxLength={80} />
        <div className="rg-par">
          <Campo etiqueta="Número" inputMode="numeric" value={v.numero} onChange={cambiar('numero')} error={errores.numero} maxLength={10} />
          <Campo etiqueta="Piso o depto (si tiene)" value={v.piso} onChange={cambiar('piso')} maxLength={20} />
        </div>
        <Campo etiqueta="Barrio" list="rg-barrios" value={v.barrio} onChange={cambiar('barrio')} error={errores.barrio} maxLength={80} />
        <datalist id="rg-barrios">
          {barrios.datos?.map((b) => (
            <option key={b.id} value={b.nombre} />
          ))}
        </datalist>
        <Campo etiqueta="Ciudad" autoComplete="address-level2" value={v.ciudad} onChange={cambiar('ciudad')} error={errores.ciudad} maxLength={80} />
        <AvisoPrivado>Cifrado. Los clientes solo ven tu zona de trabajo, nunca tu domicilio.</AvisoPrivado>
        <FalloPaso fallo={fallo} />
      </MarcoPaso>
    </form>
  );
}

/** RG-3: rubros. Gas y Aire acondicionado piden matrícula para habilitarse (se carga en el paso 8). */
export function PasoRubros() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [elegidos, setElegidos] = useState<Rubro[]>(r.rubros.map((x) => x.rubro));
  const [error, setError] = useState<string | null>(null);
  const conMatricula = elegidos.filter(requiereMatricula);

  async function guardar() {
    if (elegidos.length === 0) return setError('Elegí al menos un rubro.');
    setError(null);
    const igual = elegidos.length === r.rubros.length && elegidos.every((x) => r.rubros.some((y) => y.rubro === x));
    if (igual) return seguir('rubros');
    const x = await ejecutar(async () => fijar(await api.guardarRubrosRegistro({ rubros: elegidos, version: r.version })));
    if (x.ok) seguir('rubros');
  }

  return (
    <MarcoPaso
      paso="rubros"
      antes="¿En qué "
      marcado="trabajás?"
      bajada="Elegí uno o más. Podés sumar otros después."
      accion={
        <Boton ocupado={pendiente} textoOcupado="Guardando…" onClick={() => void guardar()}>
          {elegidos.length ? `Seguir con ${plural(elegidos.length, 'rubro', 'rubros')}` : 'Seguir'}
        </Boton>
      }
    >
      <GrillaOpciones leyenda="Tus rubros">
        {RUBROS.map((rubro) => (
          <OpcionMosaico
            key={rubro}
            icono={ICONO_RUBRO[rubro]}
            titulo={NOMBRE_RUBRO[rubro]}
            insignia={requiereMatricula(rubro) ? 'Pide matrícula' : undefined}
            marcado={elegidos.includes(rubro)}
            onCambio={(on) => setElegidos((xs) => RUBROS.filter((x) => (x === rubro ? on : xs.includes(x))))}
          />
        ))}
      </GrillaOpciones>
      {conMatricula.length ? (
        <AvisoCaja tono="alerta" titulo={`${conMatricula.map((x) => NOMBRE_RUBRO[x]).join(' y ')}: con matrícula`}>
          Se habilita{conMatricula.length > 1 ? 'n' : ''} cuando verificamos tu matrícula. La cargás en el paso 8.
        </AvisoCaja>
      ) : null}
      {error ? <AvisoCaja tono="error" titulo={error} /> : null}
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}

/** RG-4: los barrios donde querés trabajar. Solo te llegan pedidos de esas zonas; se cambian cuando quieras. */
export function PasoZonas() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const barrios = useCarga(() => api.barrios(), []);
  const [elegidos, setElegidos] = useState<string[]>(r.zonas);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (elegidos.length === 0) return setError('Elegí al menos un barrio.');
    setError(null);
    const igual = elegidos.length === r.zonas.length && elegidos.every((x) => r.zonas.includes(x));
    if (igual) return seguir('zonas');
    const x = await ejecutar(async () => fijar(await api.guardarZonas({ barrios: elegidos, version: r.version })));
    if (x.ok) seguir('zonas');
  }

  return (
    <MarcoPaso
      paso="zonas"
      antes="¿Por dónde "
      marcado="te movés?"
      bajada="Solo te llegan pedidos de estas zonas. Lo cambiás cuando quieras."
      accion={
        <Boton ocupado={pendiente} textoOcupado="Guardando…" onClick={() => void guardar()}>
          Seguir
        </Boton>
      }
    >
      <div className="rg-mapa">
        <MapaBarrios resaltadas={elegidos.length * 3} tam="lleno" />
        <span className="rg-mapa__chip">
          <Chip icono="pin" tono="blanco">
            {elegidos.length ? plural(elegidos.length, 'barrio elegido', 'barrios elegidos') : 'Elegí tus barrios'}
          </Chip>
        </span>
      </div>
      {barrios.fallo && !barrios.datos ? (
        <AvisoCaja tono="error" titulo="No pudimos traer los barrios" accion={<Boton variante="contorno" chico bloque={false} onClick={() => void barrios.recargar()}>Reintentar</Boton>} />
      ) : null}
      {barrios.datos ? <PastillasOpcion leyenda="Barrios de Mar del Plata" multiple opciones={barrios.datos.map((b) => ({ valor: b.id, texto: b.nombre }))} valores={elegidos} onCambio={setElegidos} /> : null}
      {error ? <AvisoCaja tono="error" titulo={error} /> : null}
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}
