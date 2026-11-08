'use client';
// D6-Ayuda (lote 1.4): Centro de ayuda. Preguntas frecuentes por tema, un buscador y el acceso a soporte (tus casos). Las
// preguntas se abren de a una. Los links viejos de «Pedir ayuda sobre un trabajo» (`?trabajo=`) pasan a «Tus casos».
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { buscarPreguntas, MAS_CONSULTADAS, TEMAS_AYUDA } from '../lib/ayuda.ts';
import { plural } from '../lib/formato.ts';
import { AccionFija } from '../ui/organismos/Acciones.tsx';
import { AccesoSoporte, CabeceraAyuda, PreguntasAyuda, TemasAyuda } from '../ui/organismos/Ayuda.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';

export function Soporte() {
  const router = useRouter();
  const trabajo = useSearchParams().get('trabajo');
  // Solo para decir cuántos casos hay abiertos: si no carga, el acceso a soporte se muestra igual.
  const casos = useCarga(() => api.casos(), []);
  const [busqueda, setBusqueda] = useState('');
  const [tema, setTema] = useState<string | null>(null);

  useEffect(() => {
    if (trabajo) router.replace(`${RUTAS.casosSoporte.ruta}?trabajo=${encodeURIComponent(trabajo)}`);
  }, [trabajo, router]);

  const abiertos = casos.datos?.filter((k) => k.estado !== 'resuelto' && k.estado !== 'cerrado').length ?? null;
  const buscando = busqueda.trim() !== '';
  const elegido = TEMAS_AYUDA.find((t) => t.id === tema);
  const encontradas = buscando ? buscarPreguntas(busqueda) : [];

  const preguntas = buscando ? encontradas : (elegido?.preguntas ?? MAS_CONSULTADAS);
  const titulo = buscando ? `Lo que encontramos (${encontradas.length})` : (elegido?.texto ?? 'Lo más consultado');

  return (
    <PantallaSecundaria
      barra={<CabeceraAyuda hrefVolver={RUTAS.cuenta.ruta} horario="Soporte de 9 a 18" busqueda={busqueda} onBusqueda={setBusqueda} />}
      accion={
        <AccionFija>
          <AccesoSoporte href={RUTAS.casosSoporte.ruta} detalle={abiertos === null ? 'Respondemos en el día' : `Respondemos en el día · ${abiertos === 0 ? 'ningún caso abierto' : plural(abiertos, 'caso abierto', 'casos abiertos')}`} />
        </AccionFija>
      }
    >
      {!buscando ? <TemasAyuda temas={TEMAS_AYUDA.map((t) => ({ id: t.id, texto: t.texto, icono: t.icono, cantidad: t.preguntas.length }))} elegido={tema} onElegir={setTema} /> : null}
      <PreguntasAyuda
        key={`${buscando ? 'b' : tema ?? 'todas'}`}
        titulo={titulo}
        preguntas={preguntas}
        vacio={<p>No encontramos nada con esas palabras. Probá con otra, o escribinos desde «Hablar con soporte».</p>}
      />
    </PantallaSecundaria>
  );
}
