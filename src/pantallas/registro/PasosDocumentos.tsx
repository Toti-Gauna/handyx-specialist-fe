'use client';
// RG-8 Certificados y matrículas y RG-9 Antecedentes penales (lote 1.2). En Gas y Aire acondicionado la matrícula es
// obligatoria; el resto suma al perfil cuando lo verificamos. Los antecedentes son un dato sensible: cifrados, los ve
// solo el equipo de verificación, nunca van a una IA y se borran al verificarte.
import { api, camaraPrueba } from '@handyx/origen-datos';
import { useState } from 'react';
import type { Certificado, TipoCertificado } from '../../contracts/registro.ts';
import { NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import type { EstadoDocumento } from '../../contracts/maquinas.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { ESTADO_DOCUMENTO, matriculasPedidas, registroEditable } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja, AvisoPrivado } from '../../ui/moleculas/Avisos.tsx';
import { CargaArchivo, type FormatoCarga } from '../../ui/moleculas/CargaArchivo.tsx';
import { ICONO_RUBRO } from '../../ui/moleculas/MarcadorPedido.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { FalloPaso, MarcoPaso, useRegistro } from './comunes.tsx';

const simulada = camaraPrueba !== null;
const PUEDE_CAMBIAR = new Set<EstadoDocumento>(['faltante', 'cargado', 'rechazado', 'vencido']);
const nombreMatricula = (r: Rubro) => (r === 'gas' ? 'Matrícula de gasista' : `Matrícula de ${NOMBRE_RUBRO[r]}`);

function ChipEstado({ estado }: { estado: EstadoDocumento }) {
  const e = ESTADO_DOCUMENTO[estado];
  return (
    <Chip icono={e.icono} tono={e.tono}>
      {e.texto}
    </Chip>
  );
}

const OPCIONALES: readonly { valor: Exclude<TipoCertificado, 'matricula'>; texto: string; nombre: string }[] = [
  { valor: 'curso', texto: 'Un curso', nombre: 'Curso' },
  { valor: 'seguro', texto: 'Un seguro', nombre: 'Seguro de responsabilidad civil' },
  { valor: 'otro', texto: 'Otro', nombre: 'Certificado' },
];

/** RG-8: matrículas obligatorias por rubro y certificados opcionales. */
export function PasoCertificados() {
  const { r, recargar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [cambiar, setCambiar] = useState<Rubro | null>(null);
  const [tipo, setTipo] = useState<Exclude<TipoCertificado, 'matricula'>>('curso');
  const [nombre, setNombre] = useState('');
  const [quitar, setQuitar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const matriculas = matriculasPedidas(r);
  const opcionales = r.certificados.filter((c) => c.tipo !== 'matricula');
  const editable = registroEditable(r.estadoAlta);

  const cargar = async (datos: { tipo: TipoCertificado; rubro?: Rubro; nombre: string }, archivo: File | null, formato: FormatoCarga) => {
    const x = await ejecutar(async () => {
      await api.cargarCertificado(datos, { archivo, formato });
      await recargar();
    });
    if (x.ok) {
      setCambiar(null);
      setNombre('');
      setError(null);
    }
  };

  function continuar() {
    const falta = matriculas.find((m) => !m.certificado || m.certificado.estado === 'faltante');
    if (editable && falta) return setError(`Cargá la ${nombreMatricula(falta.rubro).toLowerCase()} para seguir: sin ella no podemos mandar tu alta.`);
    seguir('certificados');
  }

  const fila = (c: Certificado) => (
    <FilaIcono key={c.id} icono="documento" titulo={c.nombre} detalle={`${c.formato === 'pdf' ? 'PDF' : 'Foto'}${c.enPerfil ? ' · lo ven los clientes' : ''}`} derecha={<ChipEstado estado={c.estado} />} />
  );

  return (
    <MarcoPaso
      paso="certificados"
      antes="Certificados y "
      marcado="matrículas"
      bajada="En Gas y Aire acondicionado la matrícula es obligatoria. El resto es opcional y suma a tu perfil."
      accion={
        <Boton disabled={pendiente} onClick={continuar}>
          Seguir
        </Boton>
      }
    >
      {matriculas.length ? (
        <Tarjeta etiqueta="Obligatorios por tus rubros">
          <Etiqueta>OBLIGATORIOS POR TUS RUBROS</Etiqueta>
          {matriculas.map(({ rubro, certificado: c }) => {
            const estado = c?.estado ?? 'faltante';
            const abierta = estado === 'faltante' || cambiar === rubro;
            return (
              <div key={rubro} className="rg-doc">
                <FilaIcono icono={ICONO_RUBRO[rubro]} titulo={nombreMatricula(rubro)} detalle="Foto o PDF, vigente" derecha={<ChipEstado estado={estado} />} borde={false} />
                {abierta ? (
                  <div role="group" aria-label={`Cargar la ${nombreMatricula(rubro).toLowerCase()}`}>
                    <CargaArchivo compacta simulada={simulada} ocupado={pendiente} textoFoto={`Foto · ${NOMBRE_RUBRO[rubro]}`} textoPdf={`PDF · ${NOMBRE_RUBRO[rubro]}`} onArchivo={(a, f) => void cargar({ tipo: 'matricula', rubro, nombre: nombreMatricula(rubro) }, a, f)} />
                  </div>
                ) : PUEDE_CAMBIAR.has(estado) ? (
                  <Boton variante="texto" chico bloque={false} onClick={() => setCambiar(rubro)}>
                    Cargar otra
                  </Boton>
                ) : null}
              </div>
            );
          })}
        </Tarjeta>
      ) : null}
      <Tarjeta etiqueta="Opcionales">
        <Etiqueta>OPCIONALES · LOS VEN LOS CLIENTES AL ELEGIR</Etiqueta>
        {opcionales.map((c) => (
          <div key={c.id} className="rg-doc">
            {fila(c)}
            {PUEDE_CAMBIAR.has(c.estado) ? (
              quitar === c.id ? (
                <div className="rg-confirma" role="group" aria-label={`¿Quitar ${c.nombre}?`}>
                  <span>¿Lo quitamos?</span>
                  <Boton variante="peligro" chico bloque={false} disabled={pendiente} onClick={() => void ejecutar(async () => { await api.quitarCertificado(c.id); await recargar(); setQuitar(null); })}>
                    Sí, quitarlo
                  </Boton>
                  <Boton variante="texto" chico bloque={false} onClick={() => setQuitar(null)}>
                    No
                  </Boton>
                </div>
              ) : (
                <Boton variante="texto" chico bloque={false} onClick={() => setQuitar(c.id)}>
                  Quitar {c.nombre}
                </Boton>
              )
            ) : null}
          </div>
        ))}
        <PastillasOpcion leyenda="Sumar un certificado" opciones={OPCIONALES} valores={[tipo]} onCambio={(v) => setTipo(v[0] ?? 'curso')} />
        <Campo etiqueta="¿De qué es? (opcional)" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} ayuda="Por ejemplo: Curso de termofusión." />
        <div role="group" aria-label="Cargar el certificado">
          <CargaArchivo compacta simulada={simulada} ocupado={pendiente} textoFoto="Foto del certificado" textoPdf="PDF del certificado" onArchivo={(a, f) => void cargar({ tipo, nombre: nombre.trim() || (OPCIONALES.find((o) => o.valor === tipo)?.nombre ?? 'Certificado') }, a, f)} />
        </div>
      </Tarjeta>
      <p className="rg-nota">Revisamos cada uno. Un certificado verificado aparece en tu perfil; uno cargado, todavía no.</p>
      {error ? <AvisoCaja tono="error" titulo={error} /> : null}
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}

/** RG-9: certificado de antecedentes en foto o PDF. Se puede seguir sin él: hasta cargarlo no hay pedidos. */
export function PasoAntecedentes() {
  const { r, fijar, seguir } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [otra, setOtra] = useState(false);
  const a = r.antecedentes;
  const cargado = a.estado !== 'faltante' && a.estado !== 'rechazado' && a.estado !== 'vencido';

  async function cargar(archivo: File | null, formato: FormatoCarga) {
    const x = await ejecutar(async () => fijar(await api.cargarAntecedentes({ archivo, formato })));
    if (x.ok) setOtra(false);
  }

  return (
    <MarcoPaso
      paso="antecedentes"
      antes="Antecedentes "
      marcado="penales"
      bajada="Subí el certificado de antecedentes: una foto clara o el PDF que te dan al tramitarlo."
      accion={
        <Boton disabled={pendiente} onClick={() => seguir('antecedentes')}>
          {cargado ? 'Seguir' : 'Seguir sin cargarlo'}
        </Boton>
      }
    >
      {!cargado || otra ? (
        <CargaArchivo simulada={simulada} ocupado={pendiente} onArchivo={(f, formato) => void cargar(f, formato)} />
      ) : null}
      {cargado ? (
        <Tarjeta>
          <FilaIcono
            icono="documento"
            titulo="Certificado de antecedentes"
            detalle={a.archivoBorrado ? 'Verificado · el archivo ya se borró' : `${a.formato === 'pdf' ? 'PDF' : 'Foto'} cargada · se borra al verificarte`}
            derecha={<ChipEstado estado={a.estado} />}
            borde={false}
          />
          {PUEDE_CAMBIAR.has(a.estado) && !otra ? (
            <Boton variante="texto" chico bloque={false} onClick={() => setOtra(true)}>
              Cargar otro
            </Boton>
          ) : null}
        </Tarjeta>
      ) : null}
      <AvisoPrivado>Es un dato sensible: se guarda cifrado, lo ve solo el equipo de verificación de Handyx, nunca va a una inteligencia artificial y se borra al verificarte.</AvisoPrivado>
      {!cargado ? <p className="rg-nota">¿No lo tenés? Podés seguir y cargarlo después: hasta entonces no recibís pedidos.</p> : null}
      <FalloPaso fallo={fallo} />
    </MarcoPaso>
  );
}
