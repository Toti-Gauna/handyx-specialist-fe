'use client';
// Tus casos de ayuda (lote 1.4): los casos con soporte y «Abrir un caso» (asistencia, reclamo, pago o cuenta; opcionalmente
// sobre un trabajo). Las respuestas de Handyx y el estado quedan en cada caso. No prometemos un plazo de respuesta.
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { NuevoCasoSchema } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { CATEGORIA_SOPORTE, SOPORTE } from '../lib/etiquetas.ts';
import { enfocarPrimerError } from '../lib/foco.ts';
import { fechaHora } from '../lib/formato.ts';
import { Boton } from '../ui/atomos/Boton.tsx';
import { AreaTexto } from '../ui/atomos/AreaTexto.tsx';
import { Campo, Casilla } from '../ui/atomos/Controles.tsx';
import { Seleccion } from '../ui/atomos/Seleccion.tsx';
import { Ciudad } from '../ui/ilustraciones/Ciudad.tsx';
import { ChipEtiqueta } from '../ui/moleculas/ChipEtiqueta.tsx';
import { GrupoAjustes } from '../ui/moleculas/Ajustes.tsx';
import { FilaIcono } from '../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { EstadoVacio } from '../ui/organismos/EstadosPantalla.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';

export function CasosSoporte() {
  const router = useRouter();
  const trabajoUrl = useSearchParams().get('trabajo');
  const c = useCarga(async () => {
    const [casos, activos, historial] = await Promise.all([api.casos(), api.trabajos('activos'), api.trabajos('historial')]);
    return { casos, trabajos: [...activos.items, ...historial.items] };
  }, []);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (trabajoUrl) setAbierta(true);
  }, [trabajoUrl]);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { casos, trabajos } = c.datos;

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Tus casos" subtitulo="Ayuda y reclamos" hrefVolver={RUTAS.soporte.ruta} />}
      accion={
        <AccionFija nota="No te prometemos un plazo de respuesta: lo ves acá apenas contestamos.">
          <Boton icono="mas" onClick={() => setAbierta(true)}>
            Abrir un caso
          </Boton>
        </AccionFija>
      }
    >
      {casos.length === 0 ? (
        <EstadoVacio ilustracion={<Ciudad tam="medio" />} titulo="No abriste ningún caso">
          Si algo no salió bien o tenés una duda que no está en la ayuda, abrí un caso.
        </EstadoVacio>
      ) : (
        <GrupoAjustes>
          {casos.map((k) => (
            <FilaIcono key={k.id} icono="ayuda" titulo={k.asunto} detalle={`${CATEGORIA_SOPORTE[k.categoria]} · actualizado ${fechaHora(k.actualizadoEn)}`} derecha={<ChipEtiqueta e={SOPORTE[k.estado]} />} href={`${RUTAS.casoSoporte.ruta}?id=${k.id}`} />
          ))}
        </GrupoAjustes>
      )}
      <NuevoCaso
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        trabajos={trabajos.map((t) => ({ id: t.id, texto: `${NOMBRE_RUBRO[t.rubro]} · ${fechaHora(t.acuerdo.horario.inicio)}` }))}
        trabajoInicial={trabajoUrl}
        onCreado={(id) => router.push(`${RUTAS.casoSoporte.ruta}?id=${id}`)}
      />
    </PantallaSecundaria>
  );
}

type Categoria = keyof typeof CATEGORIA_SOPORTE;

function NuevoCaso({ abierta, ...resto }: { abierta: boolean; onCerrar(): void; trabajos: Array<{ id: string; texto: string }>; trabajoInicial: string | null; onCreado(id: string): void }) {
  // Se arma de nuevo cada vez que se abre: sin restos del caso anterior.
  return abierta ? <FormCaso {...resto} /> : <Hoja abierta={false} titulo="Abrir un caso" onCerrar={resto.onCerrar}>{null}</Hoja>;
}

function FormCaso({ onCerrar, trabajos, trabajoInicial, onCreado }: { onCerrar(): void; trabajos: Array<{ id: string; texto: string }>; trabajoInicial: string | null; onCreado(id: string): void }) {
  const { pendiente, fallo, ejecutar, clave } = useAccion();
  const [categoria, setCategoria] = useState<Categoria>(trabajoInicial ? 'reclamo' : 'asistencia');
  const [trabajoId, setTrabajoId] = useState(trabajoInicial ?? '');
  const [asunto, setAsunto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [adjunto, setAdjunto] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = NuevoCasoSchema.safeParse({ categoria, trabajoId: trabajoId || null, pedidoId: null, asunto, detalle, adjuntos: adjunto ? 1 : 0 });
    if (!ok.success) {
      const err: Record<string, string> = {};
      for (const i of ok.error.issues) err[String(i.path[0])] = i.path[0] === 'asunto' ? 'Escribí un asunto de al menos 3 letras.' : 'Contanos qué pasó.';
      setErrores(err);
      return enfocarPrimerError(form);
    }
    setErrores({});
    const r = await ejecutar(() => api.abrirCaso(ok.data, clave()));
    if (r.ok) {
      onCerrar();
      onCreado(r.valor.id);
    }
  }

  return (
    <Hoja abierta titulo="Abrir un caso" onCerrar={onCerrar} pie={<Boton type="submit" form="form-caso" ocupado={pendiente} textoOcupado="Enviando…">Enviar el caso</Boton>}>
      <form id="form-caso" className="ui-edicion" onSubmit={(e) => void enviar(e)} noValidate>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Seleccion etiqueta="¿Sobre qué es?" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
          {Object.entries(CATEGORIA_SOPORTE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Trabajo relacionado (si hay)" value={trabajoId} onChange={(e) => setTrabajoId(e.target.value)}>
          <option value="">Ninguno</option>
          {trabajos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.texto}
            </option>
          ))}
        </Seleccion>
        <Campo etiqueta="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} error={errores.asunto} maxLength={120} />
        <AreaTexto etiqueta="Contanos qué pasó" valor={detalle} onCambio={setDetalle} maximo={4000} error={errores.detalle} />
        <Casilla checked={adjunto} onChange={(e) => setAdjunto(e.target.checked)}>
          {api.origen === 'mock' ? 'Adjuntar una foto de prueba' : 'Voy a agregar una foto al caso'}
        </Casilla>
      </form>
    </Hoja>
  );
}
