'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Documento } from '../components/Documento.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, Campo, Chip, Dato, Pasos, Seleccion, Tarjeta } from '../components/ui.tsx';
import { GENEROS, GuardarDatosAltaSchema, type DatosAlta, type FaltanteEnvio, type PerfilEspecialista } from '../contracts/dto.ts';
import { RUBROS, NOMBRE_RUBRO, requiereMatricula, type Rubro } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ALTA, DOCUMENTO, FALTANTE, GENERO, PRESENCIAL, RUBRO_ESTADO } from '../lib/etiquetas.ts';

const PASOS = ['Datos', 'Identidad', 'Rubros', 'Foto', 'Antecedentes', 'Resumen'];
const PASO_DE: Record<FaltanteEnvio, number> = { datos: 0, dni: 1, cuitCuil: 1, rubros: 2, matricula: 2, fotoCara: 3 };

export function Alta() {
  const { perfil } = usePerfil();
  const datos = useCarga(() => api.datosAlta(), []);
  const editable = perfil.estadoAlta === 'borrador' || perfil.estadoAlta === 'requiere_correccion';

  if (datos.fallo && !datos.datos) return <ErrorCaja fallo={datos.fallo} onReintentar={() => void datos.recargar()} />;
  if (!datos.datos) return <Cargando />;
  return editable ? <Asistente datos={datos.datos} alGuardar={datos.recargar} /> : <EstadoRevision perfil={perfil} datos={datos.datos} />;
}

// ── Asistente por pasos ─────────────────────────────────────────────────────────────────────────

function Asistente({ datos, alGuardar }: { datos: DatosAlta; alGuardar(): Promise<void> }) {
  const { perfil, recargar } = usePerfil();
  const primero = perfil.faltantesEnvio[0];
  const [paso, setPaso] = useState(primero ? PASO_DE[primero] : 5);
  const info = ALTA[perfil.estadoAlta];

  return (
    <div className="pila">
      <h1 className="titulo">Tu alta</h1>
      {perfil.estadoAlta === 'requiere_correccion' ? (
        <Aviso tono="aviso" icono="alerta" titulo="Hay que corregir algo" role="status">
          {perfil.motivoRevision ?? info.detalle} Corregí lo que está marcado y volvé a enviar el alta.
        </Aviso>
      ) : (
        <p className="texto-suave">Se guarda en cada paso: podés dejarlo y seguir después.</p>
      )}
      <Pasos actual={paso} pasos={PASOS} />
      {paso === 0 ? <PasoDatos datos={datos} alGuardar={async () => { await alGuardar(); await recargar(); setPaso(1); }} /> : null}
      {paso === 1 ? <PasoIdentidad datos={datos} perfil={perfil} alCambiar={async () => { await alGuardar(); await recargar(); }} /> : null}
      {paso === 2 ? <PasoRubros perfil={perfil} alCambiar={recargar} /> : null}
      {paso === 3 ? <PasoFoto perfil={perfil} alCambiar={recargar} /> : null}
      {paso === 4 ? <PasoAntecedentes perfil={perfil} /> : null}
      {paso === 5 ? <PasoResumen datos={datos} perfil={perfil} irA={setPaso} alEnviar={recargar} /> : null}
      <div className="botones botones--fila">
        <button type="button" className="boton boton--claro" disabled={paso === 0} onClick={() => setPaso((p) => Math.max(0, p - 1))}>
          <Icono nombre="izquierda" /> Atrás
        </button>
        <button type="button" className="boton" disabled={paso === 5} onClick={() => setPaso((p) => Math.min(5, p + 1))}>
          Siguiente <Icono nombre="derecha" />
        </button>
      </div>
    </div>
  );
}

type ErroresCampo = Record<string, string>;
const ERR_GENERICO = 'Revisá este dato.';

function PasoDatos({ datos, alGuardar }: { datos: DatosAlta; alGuardar(): Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [f, setF] = useState({
    nombre: datos.nombre ?? '',
    apellido: datos.apellido ?? '',
    fechaNacimiento: datos.fechaNacimiento ?? '',
    nacionalidad: datos.nacionalidad ?? '',
    genero: datos.genero ?? '',
    ciudad: datos.ciudad ?? '',
    barrio: datos.barrio ?? '',
  });
  const [errores, setErrores] = useState<ErroresCampo>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const cuerpo = {
      ...(f.nombre.trim() ? { nombre: f.nombre } : {}),
      ...(f.apellido.trim() ? { apellido: f.apellido } : {}),
      ...(f.fechaNacimiento ? { fechaNacimiento: f.fechaNacimiento } : {}),
      ...(f.nacionalidad.trim() ? { nacionalidad: f.nacionalidad } : {}),
      ...(f.genero ? { genero: f.genero } : {}),
      ...(f.ciudad.trim() ? { ciudad: f.ciudad } : {}),
      ...(f.barrio.trim() ? { barrio: f.barrio } : {}),
      version: datos.version,
    };
    const ok = GuardarDatosAltaSchema.safeParse(cuerpo);
    const err: ErroresCampo = {};
    if (!ok.success) for (const i of ok.error.issues) err[String(i.path[0])] = ERR_GENERICO;
    for (const k of ['nombre', 'apellido', 'fechaNacimiento', 'nacionalidad', 'genero', 'ciudad'] as const) if (!f[k] && !err[k]) err[k] = 'Completá este dato para poder enviar tu alta.';
    setErrores(err);
    // Guarda lo válido aunque falte algo: se puede dejar el paso y retomarlo después.
    if (!ok.success) return;
    const r = await ejecutar(() => api.guardarDatosAlta(ok.data));
    if (!r.ok) {
      setErrores(Object.fromEntries((r.fallo.detalle?.campos ?? []).map((c) => [c.campo, ERR_GENERICO])));
      return;
    }
    if (Object.keys(err).length === 0) await alGuardar();
  }

  return (
    <form className="pila" onSubmit={(e) => void guardar(e)} noValidate>
      <h2>Tus datos</h2>
      <Aviso tono="neutro" icono="info">
        Por ahora Handyx solo opera en Mar del Plata. Si vivís en otra ciudad podés dejar tus datos, pero eso no significa que haya cobertura.
      </Aviso>
      {fallo && !errores.nombre ? <ErrorCaja fallo={fallo} /> : null}
      <Campo etiqueta="Nombre" autoComplete="given-name" value={f.nombre} onChange={set('nombre')} error={errores.nombre} />
      <Campo etiqueta="Apellido" autoComplete="family-name" value={f.apellido} onChange={set('apellido')} error={errores.apellido} />
      <Campo etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" max="2008-12-31" min="1930-01-01" value={f.fechaNacimiento} onChange={set('fechaNacimiento')} error={errores.fechaNacimiento} />
      <Campo etiqueta="Nacionalidad" value={f.nacionalidad} onChange={set('nacionalidad')} error={errores.nacionalidad} />
      <Seleccion etiqueta="Género" value={f.genero} onChange={set('genero')} error={errores.genero} ayuda="Es un dato de tu perfil. Podés elegir no decirlo.">
        <option value="">Elegí una opción</option>
        {GENEROS.map((g) => (
          <option key={g} value={g}>
            {GENERO[g]}
          </option>
        ))}
      </Seleccion>
      <Campo etiqueta="Ciudad donde vivís" autoComplete="address-level2" value={f.ciudad} onChange={set('ciudad')} error={errores.ciudad} />
      <Campo etiqueta="Barrio (opcional)" value={f.barrio} onChange={set('barrio')} error={errores.barrio} />
      <button type="submit" className="boton boton--bloque" disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar y seguir'}
      </button>
    </form>
  );
}

function PasoIdentidad({ datos, perfil, alCambiar }: { datos: DatosAlta; perfil: PerfilEspecialista; alCambiar(): Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [errores, setErrores] = useState<ErroresCampo>({});

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const err: ErroresCampo = {};
    if (dni && !/^\d{7,8}$/.test(dni)) err.dni = 'El DNI tiene 7 u 8 números, sin puntos.';
    if (cuit && !/^\d{11}$/.test(cuit)) err.cuitCuil = 'El CUIT o CUIL tiene 11 números, sin guiones.';
    setErrores(err);
    if (Object.keys(err).length > 0 || (!dni && !cuit)) return;
    const r = await ejecutar(() => api.guardarDatosAlta({ ...(dni ? { dni } : {}), ...(cuit ? { cuitCuil: cuit } : {}), version: datos.version }));
    if (r.ok) {
      setDni('');
      setCuit('');
      await alCambiar();
    }
  }

  return (
    <div className="pila">
      <h2>Tu identidad</h2>
      <form className="pila" onSubmit={(e) => void guardar(e)} noValidate>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Campo
          etiqueta="DNI"
          inputMode="numeric"
          autoComplete="off"
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
          placeholder={datos.dniUltimos ?? ''}
          error={errores.dni}
          ayuda={datos.dniUltimos ? `Ya cargaste el número (${datos.dniUltimos}). Escribilo de nuevo solo si querés cambiarlo.` : 'Solo números, sin puntos.'}
        />
        <Campo
          etiqueta="CUIT o CUIL"
          inputMode="numeric"
          autoComplete="off"
          value={cuit}
          onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
          placeholder={datos.cuitCuilUltimos ?? ''}
          error={errores.cuitCuil}
          ayuda={datos.cuitCuilUltimos ? `Ya cargaste el número (${datos.cuitCuilUltimos}).` : '11 números, sin guiones.'}
        />
        <Aviso tono="neutro" icono="info">
          Cargar tu CUIT o CUIL no te habilita fiscalmente por sí solo: Operations revisa los requisitos de alta.
        </Aviso>
        <button type="submit" className="boton boton--claro boton--bloque" disabled={pendiente || (!dni && !cuit)}>
          {pendiente ? 'Guardando…' : 'Guardar números'}
        </button>
      </form>
      <Documento tipo="dni" titulo="Foto del DNI" ayuda="Frente y dorso, completo, con buena luz y sin reflejos." estado={perfil.documentos.dni} editable onCargado={() => void alCambiar()} />
      <Documento tipo="cuit_cuil" titulo="Constancia de CUIT o CUIL" ayuda="La constancia que te da ARCA, con tu nombre y tu número." estado={perfil.documentos.cuitCuil} editable onCargado={() => void alCambiar()} />
    </div>
  );
}

function PasoRubros({ perfil, alCambiar }: { perfil: PerfilEspecialista; alCambiar(): Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [elegidos, setElegidos] = useState<Rubro[]>(perfil.rubros.map((r) => r.rubro));
  const cambiaron = elegidos.length !== perfil.rubros.length || elegidos.some((r) => !perfil.rubros.some((x) => x.rubro === r));

  async function guardar() {
    const r = await ejecutar(() => api.elegirRubros(elegidos));
    if (r.ok) await alCambiar();
  }

  return (
    <div className="pila">
      <h2>Tus rubros</h2>
      <p className="texto-suave">Elegí en qué rubros trabajás. Solo vas a ver pedidos de rubros que Operations haya habilitado.</p>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <fieldset>
        <legend>Rubros</legend>
        <div className="opciones">
          {RUBROS.map((r) => (
            <div className="opcion" key={r}>
              <input
                id={`rubro-${r}`}
                type="checkbox"
                checked={elegidos.includes(r)}
                onChange={(e) => setElegidos((x) => (e.target.checked ? [...x, r] : x.filter((y) => y !== r)))}
              />
              <label htmlFor={`rubro-${r}`}>
                {NOMBRE_RUBRO[r]}
                {requiereMatricula(r) ? <span className="texto-suave texto-chico"> · pide matrícula o certificación</span> : null}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      <button type="button" className="boton boton--bloque" disabled={pendiente || !cambiaron} onClick={() => void guardar()}>
        {pendiente ? 'Guardando…' : 'Guardar rubros'}
      </button>
      {perfil.rubros.length > 0 ? (
        <ul className="lista-tarjetas">
          {perfil.rubros.map((r) => (
            <li key={r.rubro} className="tarjeta">
              <div className="fila-flex fila-flex--entre">
                <p className="tarjeta__titulo">{NOMBRE_RUBRO[r.rubro]}</p>
                <Chip e={RUBRO_ESTADO[r.estado]} />
              </div>
              {r.matricula !== null ? (
                <Documento
                  tipo="matricula"
                  rubro={r.rubro}
                  titulo={`Matrícula o certificación · ${NOMBRE_RUBRO[r.rubro]}`}
                  ayuda="Una foto del documento no te habilita el rubro: Operations lo revisa y recién ahí queda verificado."
                  estado={r.matricula}
                  editable
                  onCargado={() => void alCambiar()}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PasoFoto({ perfil, alCambiar }: { perfil: PerfilEspecialista; alCambiar(): Promise<void> }) {
  return (
    <div className="pila">
      <h2>Tu foto de cara</h2>
      <p className="texto-suave">La usamos para verificar que sos vos. Tomala de frente, con buena luz, sin lentes de sol ni gorra.</p>
      <Documento tipo="foto_cara" titulo="Foto de cara" ayuda="Solo se ve en tu perfil si Operations la verificó." estado={perfil.documentos.fotoCara} editable onCargado={() => void alCambiar()} />
    </div>
  );
}

function PasoAntecedentes({ perfil }: { perfil: PerfilEspecialista }) {
  const e = PRESENCIAL[perfil.antecedentes];
  return (
    <div className="pila">
      <h2>Antecedentes</h2>
      <Aviso tono="azul" icono="escudo" titulo="Se verifican en persona">
        Operations te cita para ver tu certificado de antecedentes en persona. <strong>No lo subas ni lo mandes por foto, PDF o captura: no lo guardamos ni lo aceptamos.</strong> Solo registramos el resultado.
      </Aviso>
      <Tarjeta>
        <div className="fila-flex fila-flex--entre">
          <p className="tarjeta__titulo">Verificación presencial</p>
          <Chip e={e} />
        </div>
        <p className="texto-suave">{e.detalle}</p>
        <p>
          Cuando envíes tu alta, Operations coordina la cita. Si querés adelantarla, escribinos desde{' '}
          <Link href={RUTAS.soporte.ruta}>Ayuda</Link>.
        </p>
      </Tarjeta>
    </div>
  );
}

function PasoResumen({ datos, perfil, irA, alEnviar }: { datos: DatosAlta; perfil: PerfilEspecialista; irA(p: number): void; alEnviar(): Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const faltan = perfil.faltantesEnvio;

  async function enviar() {
    const r = await ejecutar(() => api.enviarAlta());
    if (r.ok) await alEnviar();
  }

  return (
    <div className="pila">
      <h2>Resumen</h2>
      {faltan.length > 0 ? (
        <Aviso tono="aviso" icono="alerta" titulo="Todavía falta completar" role="status">
          <ul className="sin-lista">
            {faltan.map((f) => (
              <li key={f}>
                <button type="button" className="enlace" onClick={() => irA(PASO_DE[f])}>
                  {FALTANTE[f]}
                </button>
              </li>
            ))}
          </ul>
        </Aviso>
      ) : (
        <Aviso tono="exito" icono="checkCirculo">
          Está todo cargado. Al enviar, Operations revisa tu alta: mientras tanto no vas a poder editarla.
        </Aviso>
      )}
      <Tarjeta>
        <dl>
          <Dato etiqueta="Nombre" valor={datos.nombre && datos.apellido ? `${datos.nombre} ${datos.apellido}` : 'Falta'} />
          <Dato etiqueta="Ciudad" valor={datos.ciudad ?? 'Falta'} />
          <Dato etiqueta="DNI" valor={datos.dniUltimos ?? 'Falta'} />
          <Dato etiqueta="CUIT o CUIL" valor={datos.cuitCuilUltimos ?? 'Falta'} />
          <Dato etiqueta="Rubros" valor={perfil.rubros.length ? perfil.rubros.map((r) => NOMBRE_RUBRO[r.rubro]).join(', ') : 'Falta'} />
        </dl>
      </Tarjeta>
      <Tarjeta>
        <p className="tarjeta__titulo">Documentos</p>
        <ul className="sin-lista pila pila--chica">
          {([['DNI', perfil.documentos.dni], ['CUIT o CUIL', perfil.documentos.cuitCuil], ['Foto de cara', perfil.documentos.fotoCara]] as const).map(([t, e]) => (
            <li key={t} className="fila-flex fila-flex--entre">
              <span>{t}</span>
              <Chip e={DOCUMENTO[e]} />
            </li>
          ))}
        </ul>
      </Tarjeta>
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}
      <button type="button" className="boton boton--bloque" disabled={pendiente || faltan.length > 0} onClick={() => void enviar()}>
        {pendiente ? 'Enviando…' : 'Enviar mi alta a revisión'}
      </button>
    </div>
  );
}

// ── Alta enviada, en revisión, habilitada o rechazada ───────────────────────────────────────────

function EstadoRevision({ perfil, datos }: { perfil: PerfilEspecialista; datos: DatosAlta }) {
  const info = ALTA[perfil.estadoAlta];
  const pasos: Array<{ texto: string; hecho: boolean }> = [
    { texto: 'Enviaste tu alta', hecho: true },
    { texto: 'Operations revisa tus documentos', hecho: ['en_revision', 'habilitada', 'rechazada'].includes(perfil.estadoAlta) && perfil.documentos.dni !== 'cargado' },
    { texto: 'Verificación presencial de antecedentes', hecho: perfil.antecedentes === 'aprobada' },
    { texto: 'Alta habilitada', hecho: perfil.estadoAlta === 'habilitada' },
  ];
  return (
    <div className="pila">
      <h1 className="titulo">Tu alta</h1>
      <Tarjeta tono={perfil.estadoAlta === 'habilitada' ? 'gris' : undefined}>
        <div className="fila-flex">
          <Chip e={info} />
        </div>
        <p>{info.detalle}</p>
        {perfil.motivoRevision ? (
          <Aviso tono={perfil.estadoAlta === 'rechazada' ? 'error' : 'aviso'} icono="alerta">
            {perfil.motivoRevision}
          </Aviso>
        ) : null}
        {perfil.estadoAlta === 'habilitada' ? (
          <Link className="boton boton--bloque" href={RUTAS.disponibilidad.ruta}>
            Declarar mi disponibilidad
          </Link>
        ) : null}
        {perfil.estadoAlta === 'rechazada' || perfil.estadoAlta === 'suspendida' ? (
          <Link className="boton boton--claro boton--bloque" href={RUTAS.soporte.ruta}>
            Escribir a Ayuda
          </Link>
        ) : null}
      </Tarjeta>

      {perfil.estadoAlta !== 'rechazada' && perfil.estadoAlta !== 'suspendida' ? (
        <>
          <h2>Próximos pasos</h2>
          <ol className="linea-tiempo">
            {pasos.map((p) => (
              <li key={p.texto}>
                <span className={p.hecho ? '' : 'texto-suave'}>
                  {p.hecho ? <Icono nombre="check" className="icono icono--chico" /> : null} {p.texto}
                </span>
              </li>
            ))}
          </ol>
          <Aviso tono="azul" icono="escudo" titulo="Antecedentes: cita presencial">
            {PRESENCIAL[perfil.antecedentes].detalle} <strong>No se suben archivos del certificado.</strong>{' '}
            <Link href={RUTAS.soporte.ruta}>Escribinos desde Ayuda</Link> si querés coordinar la cita.
          </Aviso>
        </>
      ) : null}

      <h2>Lo que enviaste</h2>
      <Tarjeta>
        <dl>
          <Dato etiqueta="Nombre" valor={`${datos.nombre ?? ''} ${datos.apellido ?? ''}`.trim() || '—'} />
          <Dato etiqueta="DNI" valor={datos.dniUltimos ?? '—'} />
          <Dato etiqueta="CUIT o CUIL" valor={datos.cuitCuilUltimos ?? '—'} />
        </dl>
        <ul className="sin-lista pila pila--chica">
          {([['Foto del DNI', perfil.documentos.dni], ['Constancia de CUIT o CUIL', perfil.documentos.cuitCuil], ['Foto de cara', perfil.documentos.fotoCara]] as const).map(([t, e]) => (
            <li key={t} className="fila-flex fila-flex--entre">
              <span>{t}</span>
              <Chip e={DOCUMENTO[e]} />
            </li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta>
        <p className="tarjeta__titulo">Rubros</p>
        <ul className="sin-lista pila pila--chica">
          {perfil.rubros.map((r) => (
            <li key={r.rubro} className="fila-flex fila-flex--entre">
              <span>{NOMBRE_RUBRO[r.rubro]}</span>
              <Chip e={RUBRO_ESTADO[r.estado]} />
            </li>
          ))}
        </ul>
        {perfil.rubros.some((r) => r.estado === 'requiere_matricula') ? (
          <Aviso tono="aviso" icono="alerta">
            Un rubro todavía no tiene la matrícula verificada: hasta entonces no recibís pedidos de ese rubro.
          </Aviso>
        ) : null}
      </Tarjeta>
    </div>
  );
}
