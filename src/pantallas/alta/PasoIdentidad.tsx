'use client';
// Paso 2 · DNI y CUIT o CUIL (lote 4.4): primero los números, después el DNI con la cámara (frente y dorso, con marco) y
// la constancia de CUIT o CUIL. Lo cargado queda "cargado": solo Operations lo verifica. La app nunca muestra el documento.
import { api } from '@handyx/origen-datos';
import { useState, type FormEvent } from 'react';
import { Camara } from '../../components/Camara.tsx';
import { Documento } from '../../components/Documento.tsx';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Aviso, Campo, Chip } from '../../components/ui.tsx';
import type { EstadoDocumento } from '../../contracts/maquinas.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { DOCUMENTO } from '../../lib/etiquetas.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { BotonFijo } from '../../kit/Piezas.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

type Etapa = 'numeros' | 'frente' | 'dorso' | 'constancia';
const PIDE_CARGA = new Set<EstadoDocumento>(['faltante', 'rechazado', 'vencido']);
const CONSEJOS_DNI = ['Todo el documento adentro del marco', 'Con buena luz y sin reflejos', 'Sin tapar ningún dato con los dedos'];

export function PasoIdentidad({ perfil, datos, recargar, alTerminar }: PropsPaso) {
  const dniPendiente = PIDE_CARGA.has(perfil.documentos.dni);
  const [etapa, setEtapa] = useState<Etapa>(() => (!datos.dniUltimos || !datos.cuitCuilUltimos ? 'numeros' : dniPendiente ? 'frente' : 'constancia'));
  const [frente, setFrente] = useState<Blob | null>(null);
  const subir = useAccion();

  async function usarDorso(dorso: Blob | null) {
    const r = await subir.ejecutar(async () => {
      await api.cargarDocumento('dni', undefined, frente ?? undefined, dorso ?? undefined);
      await recargar();
    });
    if (r.ok) {
      setFrente(null);
      setEtapa('constancia');
    }
  }

  return (
    <MarcoPaso paso="identidad" titulo="DNI y CUIT o CUIL">
      {etapa === 'numeros' ? <Numeros datos={datos} recargar={recargar} alSeguir={() => setEtapa(dniPendiente ? 'frente' : 'constancia')} /> : null}

      {etapa === 'frente' || etapa === 'dorso' ? (
        <>
          <h2 className="hx-titulo al-pregunta__titulo">{etapa === 'frente' ? 'Sacale una foto al frente del DNI' : 'Ahora, el dorso'}</h2>
          {perfil.documentos.dni === 'rechazado' ? (
            <Aviso tono="aviso" icono="alerta">
              {perfil.motivoRevision ?? 'Operations no pudo aceptar la foto anterior.'} Sacá las dos de nuevo.
            </Aviso>
          ) : null}
          {subir.fallo ? <ErrorCaja fallo={subir.fallo} /> : null}
          {etapa === 'frente' ? (
            <Camara
              key="frente"
              modo="documento"
              titulo="Frente del DNI"
              consejos={CONSEJOS_DNI}
              textoUsar="Seguir con el dorso"
              onFoto={(f) => {
                setFrente(f);
                setEtapa('dorso');
              }}
            />
          ) : (
            <Camara key="dorso" modo="documento" titulo="Dorso del DNI" consejos={CONSEJOS_DNI} textoUsar="Usar las dos fotos" ocupado={subir.pendiente} onFoto={(d) => usarDorso(d)} />
          )}
          <p className="texto-suave texto-chico">Las fotos se mandan a un lugar privado y solo las ve el personal autorizado. No quedan guardadas en tu teléfono por la app.</p>
        </>
      ) : null}

      {etapa === 'constancia' ? (
        <>
          <h2 className="hx-titulo al-pregunta__titulo">
            Tu <span className="hx-marca">constancia</span> de CUIT o CUIL
          </h2>
          <div className="al-doc">
            <span>Foto del DNI</span>
            <Chip e={DOCUMENTO[perfil.documentos.dni]} />
          </div>
          {!PIDE_CARGA.has(perfil.documentos.dni) && perfil.documentos.dni !== 'en_revision' && perfil.documentos.dni !== 'verificado' ? (
            <button type="button" className="enlace" onClick={() => setEtapa('frente')}>
              Volver a sacar las fotos del DNI
            </button>
          ) : null}
          <Documento
            tipo="cuit_cuil"
            titulo="Constancia de CUIT o CUIL"
            ayuda="La constancia que te da ARCA, con tu nombre y tu número. Puede ser una captura o un PDF impreso y fotografiado."
            estado={perfil.documentos.cuitCuil}
            editable
            onCargado={() => void recargar()}
          />
          <Aviso tono="neutro" icono="info">
            Cargar tu CUIT o CUIL no te habilita fiscalmente por sí solo: Operations revisa los requisitos de alta.
          </Aviso>
          <BotonFijo>
            <button type="button" className="boton boton--bloque" onClick={alTerminar}>
              Listo
            </button>
          </BotonFijo>
        </>
      ) : null}
    </MarcoPaso>
  );
}

function Numeros({ datos, recargar, alSeguir }: Pick<PropsPaso, 'datos' | 'recargar'> & { alSeguir(): void }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [errores, setErrores] = useState<{ dni?: string; cuitCuil?: string }>({});

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err: typeof errores = {};
    if (!dni && !datos.dniUltimos) err.dni = 'Escribí tu número de DNI.';
    else if (dni && !/^\d{7,8}$/.test(dni)) err.dni = 'El DNI tiene 7 u 8 números, sin puntos.';
    if (!cuit && !datos.cuitCuilUltimos) err.cuitCuil = 'Escribí tu CUIT o CUIL.';
    else if (cuit && !/^\d{11}$/.test(cuit)) err.cuitCuil = 'El CUIT o CUIL tiene 11 números, sin guiones.';
    setErrores(err);
    if (Object.keys(err).length > 0) return enfocarPrimerError(form);
    if (!dni && !cuit) return alSeguir();
    const r = await ejecutar(async () => {
      await api.guardarDatosAlta({ ...(dni ? { dni } : {}), ...(cuit ? { cuitCuil: cuit } : {}), version: datos.version });
      await recargar();
    });
    if (r.ok) alSeguir();
  }

  return (
    <form className="al-pregunta" onSubmit={(e) => void guardar(e)} noValidate>
      <h2 className="hx-titulo al-pregunta__titulo">
        Tus <span className="hx-marca">números</span>
      </h2>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <Campo
        etiqueta="DNI"
        inputMode="numeric"
        autoComplete="off"
        value={dni}
        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
        error={errores.dni}
        ayuda={datos.dniUltimos ? `Ya lo cargaste (${datos.dniUltimos}). Escribilo solo si querés cambiarlo.` : 'Solo números, sin puntos.'}
      />
      <Campo
        etiqueta="CUIT o CUIL"
        inputMode="numeric"
        autoComplete="off"
        value={cuit}
        onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
        error={errores.cuitCuil}
        ayuda={datos.cuitCuilUltimos ? `Ya lo cargaste (${datos.cuitCuilUltimos}).` : '11 números, sin guiones.'}
      />
      <p className="texto-suave texto-chico">Después de guardarlos, solo vas a ver los últimos números.</p>
      <BotonFijo>
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar y seguir'}
        </button>
      </BotonFijo>
    </form>
  );
}
