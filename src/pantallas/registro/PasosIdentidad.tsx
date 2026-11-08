'use client';
// RG-5 Selfie, RG-6 DNI de frente y dorso y RG-7 CUIT o CUIL (lote 1.2). Cargar no es estar verificado: lo revisa el
// equipo de verificación de Handyx. Las fotos viven solo en memoria hasta que se mandan.
import { api, camaraPrueba } from '@handyx/origen-datos';
import { useRef, useState, type FormEvent } from 'react';
import { FACTURACIONES, type Facturacion } from '../../contracts/registro.ts';
import type { EstadoDocumento } from '../../contracts/maquinas.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { cuitValido, dniValido, ESTADO_DOCUMENTO, NOMBRE_FACTURACION } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja, AvisoPrivado } from '../../ui/moleculas/Avisos.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { CamaraGuia } from '../../ui/organismos/CamaraGuia.tsx';
import { FalloPaso, MarcoPaso, useRegistro } from './comunes.tsx';

const BLOQUEADO = new Set<EstadoDocumento>(['en_revision', 'verificado']);

function EstadoCargado({ titulo, estado }: { titulo: string; estado: EstadoDocumento }) {
  const e = ESTADO_DOCUMENTO[estado];
  return (
    <Tarjeta>
      <FilaIcono
        icono="check"
        titulo={titulo}
        detalle={estado === 'verificado' ? 'Ya lo verificamos.' : 'Cargado. Lo revisamos nosotros: cargarlo no es estar verificado.'}
        derecha={
          <Chip icono={e.icono} tono={e.tono}>
            {e.texto}
          </Chip>
        }
        borde={false}
      />
    </Tarjeta>
  );
}

/** RG-5: selfie con el óvalo de guía, para que el cliente sepa quién llega y para compararla con tu DNI. */
export function PasoSelfie() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [otra, setOtra] = useState(false);
  const cargada = r.selfie !== 'faltante' && r.selfie !== 'rechazado' && r.selfie !== 'vencido';

  async function usar(foto: Blob | null) {
    const x = await ejecutar(async () => fijar(await api.cargarSelfie(foto, r.version)));
    if (x.ok) seguir('selfie');
  }

  const camara = !cargada || otra;
  return (
    <MarcoPaso
      paso="selfie"
      antes="Una foto de "
      marcado="tu cara"
      bajada="Para que el cliente sepa quién llega y para compararla con tu DNI."
      accion={
        camara ? (
          <p className="rg-nota">Sacá la foto con el botón de arriba.</p>
        ) : (
          <Boton onClick={() => seguir('selfie')}>Seguir</Boton>
        )
      }
    >
      {camara ? (
        <CamaraGuia
          guia="ovalo"
          titulo="Tu cara"
          texto="Mirá a la cámara"
          consejos={['Con buena luz, mirando a una ventana', 'Sin anteojos de sol ni gorra', 'La cara entera dentro del óvalo']}
          simulada={camaraPrueba}
          ocupado={pendiente}
          onFoto={usar}
        />
      ) : (
        <>
          <EstadoCargado titulo="Tu selfie" estado={r.selfie} />
          {!BLOQUEADO.has(r.selfie) ? (
            <Boton variante="contorno" icono="camara" onClick={() => setOtra(true)}>
              Sacar otra
            </Boton>
          ) : null}
        </>
      )}
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}

/** RG-6: el número y las fotos del DNI de frente y dorso, dentro del marco. Se borran a los 90 días de verificarte. */
export function PasoDni() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [numero, setNumero] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [frente, setFrente] = useState<{ foto: Blob | null } | null>(null);
  const [otra, setOtra] = useState(false);
  const campo = useRef<HTMLDivElement>(null);
  const cargado = r.dni.frente !== 'faltante' && r.dni.frente !== 'rechazado' && r.dni.frente !== 'vencido';
  const camara = !cargado || otra;

  function validarNumero(): string | null {
    const d = dniValido(numero);
    setError(d ? null : 'Escribí el número de tu DNI: 7 u 8 números, sin puntos.');
    if (!d) enfocarPrimerError(campo.current);
    return d;
  }

  async function usarDorso(dorso: Blob | null) {
    const d = validarNumero();
    if (!d || !frente) return;
    const x = await ejecutar(async () => fijar(await api.cargarDni({ frente: frente.foto, dorso, numero: d, version: r.version })));
    if (x.ok) seguir('dni');
  }

  return (
    <MarcoPaso
      paso="dni"
      antes="Tu "
      marcado="DNI"
      bajada="Frente y dorso. Lo revisamos nosotros: cargarlo no es estar verificado."
      accion={camara ? <p className="rg-nota">Sacá las fotos con el botón de arriba.</p> : <Boton onClick={() => seguir('dni')}>Seguir</Boton>}
    >
      {camara ? (
        <>
          <div ref={campo}>
            <Campo etiqueta="Número de DNI" inputMode="numeric" autoComplete="off" value={numero} onChange={(e) => setNumero(e.target.value)} onBlur={() => numero && validarNumero()} error={error} ayuda="Sin puntos. En la app vas a ver solo los últimos números." />
          </div>
          <CamaraGuia
            key={frente ? 'dorso' : 'frente'}
            guia="marco"
            titulo={frente ? 'Dorso del DNI' : 'Frente del DNI'}
            texto={frente ? 'Ahora el dorso, dentro del marco' : 'El frente, dentro del marco'}
            arriba={
              <>
                <Chip icono={frente ? 'check' : 'camara'} tono={frente ? 'exito' : 'amarillo'}>
                  {frente ? 'Frente listo' : 'Frente'}
                </Chip>
                <Chip icono="camara" tono={frente ? 'amarillo' : 'blanco'}>
                  Dorso
                </Chip>
              </>
            }
            consejos={['Sobre una mesa, con buena luz', 'Que se lean bien los números', 'Sin reflejos ni dedos encima']}
            simulada={camaraPrueba}
            textoUsar={frente ? 'Usar las dos fotos' : 'Seguir con el dorso'}
            ocupado={pendiente}
            onFoto={(f) => (frente ? usarDorso(f) : setFrente({ foto: f }))}
          />
          {frente ? (
            <Boton variante="texto" onClick={() => setFrente(null)}>
              Sacar de nuevo el frente
            </Boton>
          ) : null}
        </>
      ) : (
        <>
          <EstadoCargado titulo={`DNI terminado en ${r.dni.ultimos ?? '…'}`} estado={r.dni.frente} />
          {!BLOQUEADO.has(r.dni.frente) ? (
            <Boton variante="contorno" icono="camara" onClick={() => setOtra(true)}>
              Cargarlo de nuevo
            </Boton>
          ) : null}
        </>
      )}
      <AvisoPrivado>Cifrado. Se borra a los 90 días de verificarte; en tu perfil solo se ven los últimos números.</AvisoPrivado>
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}

/** RG-7: CUIT o CUIL y cómo facturás. Vuelven solo los últimos dígitos. */
export function PasoCuit() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [cuit, setCuit] = useState('');
  const [facturacion, setFacturacion] = useState<Facturacion | null>(r.cuitCuil.facturacion);
  const [errores, setErrores] = useState<{ cuit?: string; facturacion?: string }>({});
  const cargado = r.cuitCuil.estado !== 'faltante' && r.cuitCuil.estado !== 'rechazado' && r.cuitCuil.estado !== 'vencido';
  const bloqueado = BLOQUEADO.has(r.cuitCuil.estado);

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (bloqueado || (cargado && !cuit)) return seguir('cuit_cuil');
    const d = cuitValido(cuit);
    const err = { cuit: d ? undefined : 'Revisá el número: son 11 números y no parece un CUIT o CUIL.', facturacion: facturacion ? undefined : 'Elegí cómo facturás.' };
    setErrores(err);
    if (!d || !facturacion) return enfocarPrimerError(form);
    const x = await ejecutar(async () => fijar(await api.guardarCuit({ cuitCuil: d, facturacion, version: r.version })));
    if (x.ok) seguir('cuit_cuil');
  }

  return (
    <form className="rg-form" noValidate onSubmit={(e) => void guardar(e)}>
      <MarcoPaso paso="cuit_cuil" antes="Tu " marcado="CUIT o CUIL" bajada="Para tu perfil y para tus facturas. Si sos monotributista, va tu CUIT." accion={<Boton type="submit" ocupado={pendiente} textoOcupado="Guardando…">Seguir</Boton>}>
        {cargado ? <EstadoCargado titulo={`Terminado en ${r.cuitCuil.ultimos ?? '…'}`} estado={r.cuitCuil.estado} /> : null}
        {bloqueado ? null : (
          <>
            <Campo etiqueta={cargado ? 'Otro CUIT o CUIL (si lo querés cambiar)' : 'CUIT o CUIL'} icono="documento" inputMode="numeric" autoComplete="off" value={cuit} onChange={(e) => setCuit(e.target.value)} error={errores.cuit} ayuda="11 números, con o sin guiones." />
            <PastillasOpcion leyenda="¿Cómo facturás?" opciones={FACTURACIONES.map((f) => ({ valor: f, texto: NOMBRE_FACTURACION[f] }))} valores={facturacion ? [facturacion] : []} onCambio={(v) => setFacturacion(v[0] ?? null)} />
            {errores.facturacion ? <AvisoCaja tono="error" titulo={errores.facturacion} /> : null}
          </>
        )}
        <AvisoPrivado>Se guarda cifrado; en la app se ven solo los últimos dígitos.</AvisoPrivado>
        <FalloPaso fallo={fallo} />
      </MarcoPaso>
    </form>
  );
}
