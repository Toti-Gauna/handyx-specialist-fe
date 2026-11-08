'use client';
// T-Modelo3D (lote 2.4): el modelo que se armó en el teléfono. Se gira y se acerca (con gestos o con botones), muestra
// sus medidas aproximadas, se ve en el lugar con AR (si el teléfono tiene), se comparte o se guarda en un trabajo
// (GLB; lo ven vos y tu cliente). Vive en la memoria de la app hasta que lo guardás: nada en el navegador.
import { api } from '@handyx/origen-datos';
import { useMemo, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { medidasEnTexto } from '../../herramientas/escaneo.ts';
import { modeloActual } from '../../herramientas/modeloEnMemoria.ts';
import { fechaCorta } from '../../lib/formato.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { BotonAr } from '../../tres/BotonAr.tsx';
import { describirMedidas } from '../../tres/cotas.ts';
import { escenaModeloEscaneado, glbDelModelo } from '../../tres/escenaModelo.ts';
import { Visor3D, type ManejoVisor } from '../../tres/Visor3D.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Radio } from '../../ui/atomos/Controles.tsx';
import { CajaHerramientas } from '../../ui/ilustraciones/Herramientas.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { EstadoVacio } from '../../ui/organismos/EstadosPantalla.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './herramientas.css';

export function ModeloTres() {
  const [modelo] = useState(modeloActual);
  const visor = useRef<ManejoVisor>(null);
  const [guardar, setGuardar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const montar = useMemo(() => (modelo ? escenaModeloEscaneado(modelo) : () => undefined), [modelo]);

  if (!modelo)
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="Modelo 3D" hrefVolver={RUTAS.tallerHerramientas.ruta} />}>
        <EstadoVacio ilustracion={<CajaHerramientas tam="chico" />} titulo="No hay un modelo armado" accion={<BotonEnlace href={RUTAS.tallerEscanear.ruta} icono="cubo">Escanear un objeto</BotonEnlace>}>
          El modelo vive en tu teléfono mientras la app está abierta. Escaneá un objeto para armarlo.
        </EstadoVacio>
      </PantallaSecundaria>
    );

  const medidas = describirMedidas(medidasEnTexto(modelo.medidas));
  const texto = `${modelo.nombre}: ${medidas.charAt(0).toLowerCase()}${medidas.slice(1)}`;

  async function compartir() {
    if (!modelo) return;
    const resumen = `${modelo.nombre}\n${medidas}\nArmado con la cámara del teléfono: confirmá las medidas con la cinta.`;
    try {
      const png = await visor.current?.imagen();
      const archivo = png ? new File([png], 'modelo.png', { type: 'image/png' }) : null;
      if (archivo && navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo], text: resumen, title: modelo.nombre });
      else if (navigator.share) await navigator.share({ text: resumen, title: modelo.nombre });
      else {
        await navigator.clipboard.writeText(resumen);
        setAviso('Copiamos las medidas. Pegalas en el chat o en tu presupuesto.');
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={`${modelo.nombre} en 3D`} subtitulo={`Listo · ${modelo.fotosUsadas} de ${modelo.fotosTotal} fotos`} hrefVolver={RUTAS.tallerEscanear.ruta} />}
      accion={
        <AccionFija>
          <Boton icono="obra" onClick={() => setGuardar(true)}>
            Guardar en un trabajo
          </Boton>
        </AccionFija>
      }
    >
      <Visor3D ref={visor} montar={montar} descripcion={texto} descripcionVisible={false} fondo="claro" ayuda="Girá y acercá con el dedo o con los botones." />
      {aviso ? <AvisoCaja tono="exito">{aviso}</AvisoCaja> : null}
      <Tarjeta como="div">
        <FilaIcono icono="regla" titulo="Medidas" detalle={medidas} />
        <FilaIcono icono="cubo" titulo="Ver en el lugar (AR)" detalle="Cómo queda el equipo en ese lugar, en tamaño real. Si tu teléfono no tiene AR, no aparece el botón." />
      </Tarjeta>
      <BotonAr crear={() => visor.current?.objeto() ?? null} escala={1} superficie="piso" texto="Ver en el lugar" miniatura={() => visor.current?.imagen() ?? Promise.resolve(null)} />
      <Boton variante="contorno" icono="enviar" onClick={() => void compartir()}>
        Compartir
      </Boton>
      <p className="th-pie">Las medidas son aproximadas: para cortar o comprar, confirmalas con la cinta.</p>
      <HojaGuardar
        abierta={guardar}
        onCerrar={() => setGuardar(false)}
        crearArchivo={() => glbDelModelo(modelo.malla, modelo.nombre)}
        nombre={`${modelo.nombre} · ${medidas.replace(' · aprox.', '')}`}
        onGuardado={(t) => {
          setGuardar(false);
          setAviso(`Lo guardamos en «${t}». Lo ven vos y tu cliente en el trabajo.`);
        }}
      />
    </PantallaSecundaria>
  );
}

/** Elegir el trabajo (de los activos) y guardar el modelo ahí. */
function HojaGuardar({ abierta, onCerrar, crearArchivo, nombre, onGuardado }: { abierta: boolean; onCerrar(): void; crearArchivo(): Promise<Blob>; nombre: string; onGuardado(titulo: string): void }) {
  const c = useCarga(() => (abierta ? api.trabajos('activos') : Promise.resolve(null)), [abierta]);
  const [elegido, setElegido] = useState<string | null>(null);
  const accion = useAccion();
  const trabajos = c.datos?.items ?? [];
  const titulo = (id: string) => {
    const t = trabajos.find((x) => x.id === id);
    return t ? t.acuerdo.alcance.slice(0, 60) : 'tu trabajo';
  };

  async function guardar() {
    if (!elegido) return;
    const r = await accion.ejecutar(async () => api.guardarAdjuntoTrabajo(elegido, { tipo: 'modelo_3d', nombre: nombre.slice(0, 120) }, await crearArchivo(), accion.clave()));
    if (r.ok) onGuardado(titulo(elegido));
  }

  return (
    <Hoja
      abierta={abierta}
      titulo="Guardar en un trabajo"
      onCerrar={onCerrar}
      pie={
        <Boton disabled={!elegido} ocupado={accion.pendiente} textoOcupado="Guardando…" onClick={() => void guardar()}>
          Guardar el modelo
        </Boton>
      }
    >
      <div className="th-columna">
        {c.fallo && !c.datos ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
        {c.datos && trabajos.length === 0 ? <p className="th-pie">No tenés trabajos activos. Compartilo y guardalo cuando tengas el trabajo.</p> : null}
        {trabajos.length ? (
          <fieldset className="th-trabajos">
            <legend>¿En qué trabajo?</legend>
            {trabajos.map((t) => (
              <Radio key={t.id} name="trabajo" value={t.id} checked={elegido === t.id} onChange={() => setElegido(t.id)} ayuda={`${NOMBRE_RUBRO[t.rubro]} · ${fechaCorta(t.acuerdo.horario.inicio)}`}>
                {t.acuerdo.alcance.slice(0, 80)}
              </Radio>
            ))}
          </fieldset>
        ) : null}
        <p className="th-pie">Se guarda el modelo (sin fotos ni ubicación). Lo ven vos y tu cliente.</p>
        {accion.fallo ? <ErrorCaja fallo={accion.fallo} /> : null}
      </div>
    </Hoja>
  );
}
