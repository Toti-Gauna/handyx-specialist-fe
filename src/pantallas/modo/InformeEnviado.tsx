'use client';
// Trabajo terminado (H0-InformeEnviado, lote 2.3): el informe le llegó al cliente. Su conformidad (la da desde su app
// con un toque), la garantía activa, el recordatorio de mantenimiento (para vos) y cómo va el cobro (informado ≠
// verificado), con el PDF y el chat. La ilustración arma el arreglo terminado; es decorativa y el texto dice lo importante.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import type { Cobro } from '../../contracts/ingresos.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip, Etiqueta, Titulo } from '../../ui/atomos/Texto.tsx';
import { ArregloRubro } from '../../ui/ilustraciones/Arreglos.tsx';
import { textoCifra } from '../../ui/logica.ts';
import { ESTADO_CONFORMIDAD, hoyBA, textoFecha, tituloTrabajo } from '../../ui/logicaModo.ts';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga } from './comunes.tsx';

const TITULO = 'Trabajo terminado';

const COBRO: Record<Cobro['estado'], { texto: string; tono: 'gris' | 'exito' | 'error' | 'amarillo' }> = {
  pendiente: { texto: 'Sin informar', tono: 'amarillo' },
  reportado: { texto: 'Por verificar', tono: 'gris' },
  verificado: { texto: 'Verificado', tono: 'exito' },
  fallido: { texto: 'El pago falló', tono: 'error' },
  en_discrepancia: { texto: 'En revisión', tono: 'amarillo' },
};
const METODO: Record<string, string> = {
  efectivo: 'en efectivo',
  mercado_pago: 'por Mercado Pago',
  transferencia: 'por transferencia',
};

export function InformeEnviado() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, informe] = await Promise.all([api.trabajo(id), api.informeTrabajo(id)]);
    const cobro = detalle.pagoId ? await api.cobro(detalle.pagoId) : null;
    return { detalle, informe, cobro };
  }, [id]);
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  const { detalle: d, informe, cobro } = c.datos;
  const hoy = hoyBA(api.ahora());
  const nombre = d.contraparte;

  if (!informe.enviadoEn) {
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo={TITULO} hrefVolver={conId('trabajo', id)} />}>
        <p>Todavía no mandaste el informe de este trabajo.</p>
        <BotonEnlace icono="escudo" href={conId('informeTrabajo', id)}>
          Ir al informe
        </BotonEnlace>
      </PantallaSecundaria>
    );
  }
  const conf = ESTADO_CONFORMIDAD[informe.conformidad.estado];
  const g = informe.garantia;
  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={TITULO} subtitulo={tituloTrabajo(d.trabajo.acuerdo.alcance)} hrefVolver={RUTAS.inicio.ruta} />}
      accion={
        <AccionFija>
          <BotonEnlace icono="casa" href={RUTAS.inicio.ruta}>
            Volver a tu día
          </BotonEnlace>
        </AccionFija>
      }
    >
      <div className="mt-hecho">
        <span className="mt-hecho__ilu">
          <ArregloRubro rubro={d.trabajo.rubro} armar tam="medio" />
        </span>
        <Etiqueta>Informe enviado</Etiqueta>
        <Titulo nivel={2} antes="Le llegó a " marcado={nombre} />
      </div>
      <Tarjeta etiqueta="Después del trabajo">
        <h2 className="visualmente-oculto">Después del trabajo</h2>
        <FilaIcono
          icono="firma"
          titulo={`Conformidad de ${nombre}`}
          detalle={
            informe.conformidad.estado === 'esperando'
              ? 'La da desde su app con un toque'
              : informe.conformidad.estado === 'con_observaciones'
                ? 'Te escribió una observación: la revisa el equipo de Handyx con vos'
                : 'Quedó registrada'
          }
          derecha={
            <Chip tono={conf.tono} icono={conf.icono}>
              {conf.texto}
            </Chip>
          }
        />
        {g ? <FilaIcono icono="escudo" titulo={g.estado === 'activa' ? 'Garantía activa' : 'Garantía vencida'} detalle={`${g.dias} días · hasta el ${textoFecha(g.hasta, hoy)}`} /> : null}
        <FilaIcono
          icono="agenda"
          titulo="Recordatorio de mantenimiento"
          detalle={informe.recordatorioMantenimiento ? `${textoFecha(informe.recordatorioMantenimiento, hoy)} · te avisamos a vos` : 'Sin recordatorio'}
        />
        {cobro ? (
          <FilaIcono
            icono="billete"
            titulo="Cobro"
            detalle={`${textoCifra((cobro.informado ?? cobro.monto).centavos)}${cobro.metodo ? ` ${METODO[cobro.metodo] ?? ''}` : ''} · ${cobro.estado === 'pendiente' ? 'directo a vos' : 'informado por vos'}`}
            href={cobro.estado === 'pendiente' ? conId('trabajoCobro', d.trabajo.id) : undefined}
            derecha={
              <Chip tono={COBRO[cobro.estado].tono} icono={cobro.estado === 'verificado' ? 'check' : 'reloj'}>
                {COBRO[cobro.estado].texto}
              </Chip>
            }
          />
        ) : null}
      </Tarjeta>
      <div className="mt-dos">
        {informe.pdf ? (
          <a className="ui-boton ui-boton--contorno ui-boton--chico ui-boton--bloque" href={informe.pdf.url} download="informe-del-trabajo.pdf">
            <span className="ui-boton__texto">Descargar el PDF</span>
          </a>
        ) : null}
        <BotonEnlace variante="contorno" chico icono="chat" href={`${RUTAS.hilo.ruta}?id=${d.trabajo.conversacionId}`}>
          Ver en el chat
        </BotonEnlace>
      </div>
    </PantallaSecundaria>
  );
}
