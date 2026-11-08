'use client';
// D6-Alta · Tu alta (lote 1.2). Cómo va: lo que está listo, lo que estamos evaluando y lo que falta; si hay que
// corregir algo, qué y dónde. Lo decide el servidor (lo cambia el equipo de verificación, no la persona): la pantalla
// se vuelve a pedir sola cada minuto. Cargar un documento no es estar verificado.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { RegistroEspecialista } from '../../contracts/registro.ts';
import { avanceAlta, ESTADO_ALTA, ETIQUETA_GRUPO, gruposAlta, NOMBRE_PASO, registroEditable, type GrupoAlta } from '../../lib/registro.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Anillo } from '../../ui/atomos/Progreso.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { EscudoVerificado } from '../../ui/ilustraciones/Estados.tsx';
import { CarpetaRevision } from '../../ui/ilustraciones/Registro.tsx';
import { AvisoCaja } from '../../ui/moleculas/Avisos.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { DetalleEstado, rutaPaso } from './comunes.tsx';

/** Con el alta en evaluación se pueden sumar certificados y cargar los antecedentes que faltaban. */
const tocable = (r: RegistroEspecialista, g: GrupoAlta): boolean =>
  registroEditable(r.estadoAlta) || ((r.estadoAlta === 'enviada' || r.estadoAlta === 'en_revision') && (g.id === 'certificados' || (g.id === 'antecedentes' && g.estado === 'falta')));

export function EstadoAlta({ r }: { r: RegistroEspecialista }) {
  const grupos = gruposAlta(r);
  const { listos, total } = avanceAlta(grupos);
  const t = ESTADO_ALTA[r.estadoAlta];
  const corregir = r.pasos.find((p) => p.estado === 'a_corregir' && p.paso !== 'revision');
  const antecedentes = grupos.find((g) => g.id === 'antecedentes');
  const enEvaluacion = r.estadoAlta === 'enviada' || r.estadoAlta === 'en_revision';

  let accion: ReactNode;
  if (r.estadoAlta === 'requiere_correccion') accion = <BotonEnlace href={rutaPaso(corregir?.paso ?? 'revision')} icono="lapiz">{corregir ? `Corregir: ${NOMBRE_PASO[corregir.paso]}` : 'Revisar y mandar de nuevo'}</BotonEnlace>;
  else if (r.estadoAlta === 'borrador') accion = <BotonEnlace href={rutaPaso(r.pasoActual)}>Seguir con mi alta</BotonEnlace>;
  else if (enEvaluacion && antecedentes?.estado === 'falta') accion = <BotonEnlace href={rutaPaso('antecedentes')} icono="subir">Cargar los antecedentes</BotonEnlace>;
  else if (enEvaluacion) accion = <BotonEnlace href={rutaPaso('certificados')} icono="subir">Sumar un certificado</BotonEnlace>;
  else if (r.estadoAlta === 'habilitada') accion = <BotonEnlace href={RUTAS.inicio.ruta}>Ir al inicio</BotonEnlace>;
  else accion = <BotonEnlace href={RUTAS.soporte.ruta} icono="chat">Escribir a Ayuda</BotonEnlace>;

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Tu alta" hrefVolver={RUTAS.cuenta.ruta} />} accion={<AccionFija>{accion}</AccionFija>}>
      <section className="rg-estado">
        <span className="rg-estado__ilu">{r.estadoAlta === 'habilitada' ? <EscudoVerificado tam="chico" /> : <CarpetaRevision tam="chico" />}</span>
        <span className="rg-estado__texto">
          <Etiqueta>{t.etiqueta}</Etiqueta>
          <h2 className="ui-titulo ui-titulo--medio">{t.titulo}</h2>
          <span className="rg-nota">{t.texto}</span>
        </span>
      </section>
      <div className="rg-avance">
        <Anillo hechas={listos} total={total} unidad="partes verificadas" />
        <p>
          {listos === total ? 'Todo lo obligatorio está listo.' : `Listas ${listos} de ${total} partes obligatorias.`}
          {enEvaluacion ? ' Te avisamos apenas tengamos una respuesta.' : ''}
        </p>
      </div>
      {r.motivoRevision && (r.estadoAlta === 'requiere_correccion' || r.estadoAlta === 'rechazada') ? (
        <AvisoCaja tono={r.estadoAlta === 'rechazada' ? 'error' : 'alerta'} titulo={r.estadoAlta === 'rechazada' ? 'Por qué' : 'Qué corregir'}>
          {r.motivoRevision}
        </AvisoCaja>
      ) : null}
      <Tarjeta etiqueta="Cómo va tu alta">
        {grupos.map((g, i) => {
          const e = ETIQUETA_GRUPO[g.estado];
          return (
            <FilaIcono
              key={g.id}
              icono={g.icono}
              titulo={g.titulo}
              borde={i > 0}
              href={tocable(r, g) ? rutaPaso(g.paso) : undefined}
              detalle={
                <DetalleEstado
                  texto={g.detalle}
                  estado={
                    <Chip icono={e.icono} tono={e.tono}>
                      {e.texto}
                    </Chip>
                  }
                />
              }
            />
          );
        })}
      </Tarjeta>
      {enEvaluacion ? <p className="rg-nota">Mientras la evaluamos no se puede cambiar lo que mandaste. Cargar un documento todavía no es estar verificado.</p> : null}
      {r.estadoAlta !== 'habilitada' ? (
        <p className="rg-enlace">
          <Link href={RUTAS.inicio.ruta}>Ir al inicio</Link>
        </p>
      ) : null}
    </PantallaSecundaria>
  );
}
